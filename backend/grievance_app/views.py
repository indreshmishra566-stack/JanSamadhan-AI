from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.core.management import call_command
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404

from .models import User, Department, Complaint, ComplaintHistory, Notification, ForwardingRecord
from .serializers import (
    RegisterSerializer, UserSerializer, DepartmentSerializer,
    ComplaintSerializer, ComplaintCreateSerializer, NotificationSerializer,
    AdminComplaintUpdateSerializer, OfficerComplaintUpdateSerializer,
    CitizenFeedbackSerializer, ForwardingRecordSerializer,
)
from .permissions import IsAdmin, IsCitizen, IsHierarchyOfficer


LEVEL_ROLE_MAP = {
    "DEPARTMENT": "OFFICER",
    "PM": "PM", "CM": "CM",
    "DISTRICT": "DISTRICT_OFFICER",
    "BLOCK": "BLOCK_OFFICER",
    "FIELD": "FIELD_OFFICER",
}
ROLE_LEVEL_MAP = {v: k for k, v in LEVEL_ROLE_MAP.items()}
ROLE_LEVEL_MAP["ADMIN"] = "PM"
ROLE_LEVEL_MAP["OFFICER"] = "FIELD"

LEVEL_ORDER = ["PM", "CM", "DISTRICT", "BLOCK", "FIELD"]


def _actor_level(user):
    if Department.objects.filter(head_officer=user, is_active=True).exists():
        return "DEPARTMENT"
    return ROLE_LEVEL_MAP.get(user.role, "FIELD")


def _complaint_owner_filter(user):
    headed_departments = Department.objects.filter(head_officer=user, is_active=True)
    q = Q(forwarded_to=user) | Q(assigned_officer=user)
    if headed_departments.exists():
        q |= Q(department__in=headed_departments)
    return q


def _department_peer_filter(user):
    q = Q(created_by=user)
    if user.department_id:
        q |= Q(department_id=user.department_id)
    headed_departments = Department.objects.filter(head_officer=user, is_active=True)
    if headed_departments.exists():
        q |= Q(department__in=headed_departments)
    return q


# ─── Auth ───────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Departments ─────────────────────────────────────────────────────────────

class DepartmentListView(generics.ListCreateAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [IsAuthenticated()]


class DepartmentDetailView(generics.RetrieveAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


# ─── Citizen Complaints ──────────────────────────────────────────────────────

class CitizenComplaintListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCitizen]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user).prefetch_related("history", "forwarding_records")

    def perform_create(self, serializer):
        complaint = serializer.save(citizen=self.request.user)
        if complaint.assigned_officer:
            ForwardingRecord.objects.create(
                complaint=complaint,
                from_user=None,
                to_user=complaint.assigned_officer,
                from_level="SYSTEM",
                to_level="DEPARTMENT",
                action="ASSIGN",
                note="Auto-routed to department nodal officer.",
            )
            ComplaintHistory.objects.create(
                complaint=complaint,
                changed_by=None,
                old_status="PENDING",
                new_status=complaint.status,
                note="Auto-routed to department nodal officer.",
            )
            _notify(complaint.assigned_officer, complaint, "ASSIGNED",
                    f"New Department Grievance: #{complaint.ticket_id}",
                    f"A new grievance was routed to {complaint.department.name}.")
        _notify(complaint.citizen, complaint, "ASSIGNED",
                "Complaint Received",
                f"Your complaint #{complaint.ticket_id} has been submitted successfully.")


class CitizenComplaintDetailView(generics.RetrieveAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsCitizen]

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user)


class CitizenFeedbackView(generics.UpdateAPIView):
    serializer_class = CitizenFeedbackSerializer
    permission_classes = [IsAuthenticated, IsCitizen]

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user, status="RESOLVED")

    def perform_update(self, serializer):
        complaint = serializer.save()
        ComplaintHistory.objects.create(
            complaint=complaint,
            changed_by=self.request.user,
            note=f"Citizen rated: {complaint.citizen_rating}/5",
        )


# ─── Hierarchy: Forward / Escalate ──────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsHierarchyOfficer])
def forward_complaint(request, pk):
    """Forward complaint DOWN the hierarchy to a specific officer."""
    complaint = get_object_or_404(Complaint, pk=pk)
    to_user_id = request.data.get("to_user_id")
    note = request.data.get("note", "")

    if not to_user_id:
        return Response({"error": "to_user_id is required"}, status=400)

    to_user = get_object_or_404(User, pk=to_user_id)
    user = request.user

    # Determine levels
    from_level = _actor_level(user)
    to_level = ROLE_LEVEL_MAP.get(to_user.role, "FIELD")

    # Record forwarding
    ForwardingRecord.objects.create(
        complaint=complaint,
        from_user=user,
        to_user=to_user,
        from_level=from_level,
        to_level=to_level,
        action="FORWARD",
        note=note,
    )

    complaint.forwarded_to = to_user
    complaint.assigned_officer = to_user
    complaint.current_level = "DEPARTMENT" if Department.objects.filter(head_officer=to_user, is_active=True).exists() else to_level
    complaint.status = "FORWARDED"
    complaint.save()

    ComplaintHistory.objects.create(
        complaint=complaint,
        changed_by=user,
        old_status="ASSIGNED",
        new_status="FORWARDED",
        note=f"Forwarded to {to_user.get_full_name() or to_user.username} ({to_user.role}). {note}",
    )

    # Notify the recipient
    _notify(to_user, complaint, "FORWARDED",
            f"Complaint #{complaint.ticket_id} Forwarded to You",
            f"{user.get_full_name() or user.username} has forwarded this complaint for your action.")

    # Notify citizen
    _notify(complaint.citizen, complaint, "STATUS_UPDATE",
            f"Complaint #{complaint.ticket_id} Forwarded",
            f"Your complaint has been forwarded to {to_user.role.replace('_', ' ').title()} level for action.")

    return Response(ComplaintSerializer(complaint).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsHierarchyOfficer])
def escalate_complaint(request, pk):
    """Escalate complaint UP the hierarchy."""
    complaint = get_object_or_404(Complaint, pk=pk)
    note = request.data.get("note", "")
    user = request.user

    from_level = ROLE_LEVEL_MAP.get(user.role, "FIELD")
    from_idx = LEVEL_ORDER.index(from_level) if from_level in LEVEL_ORDER else len(LEVEL_ORDER) - 1

    if from_idx == 0:
        return Response({"error": "Already at the highest level"}, status=400)

    to_level = LEVEL_ORDER[from_idx - 1]

    # Find a user at the target level
    to_role = LEVEL_ROLE_MAP.get(to_level, "PM")
    to_user = User.objects.filter(role=to_role).first()
    if not to_user:
        to_user = User.objects.filter(role__in=["ADMIN", "PM"]).first()

    ForwardingRecord.objects.create(
        complaint=complaint,
        from_user=user,
        to_user=to_user,
        from_level=from_level,
        to_level=to_level,
        action="ESCALATE",
        note=note,
    )

    old_status = complaint.status
    complaint.current_level = to_level
    complaint.status = "ESCALATED"
    if to_user:
        complaint.forwarded_to = to_user
        complaint.assigned_officer = to_user
    complaint.save()

    ComplaintHistory.objects.create(
        complaint=complaint,
        changed_by=user,
        old_status=old_status,
        new_status="ESCALATED",
        note=f"Escalated from {from_level} to {to_level}. {note}",
    )

    if to_user:
        _notify(to_user, complaint, "ESCALATION",
                f"Complaint #{complaint.ticket_id} Escalated to You",
                f"Complaint escalated from {from_level} level. Immediate attention required.")

    _notify(complaint.citizen, complaint, "ESCALATION",
            f"Complaint #{complaint.ticket_id} Escalated",
            f"Your complaint has been escalated to a higher authority for faster resolution.")

    return Response(ComplaintSerializer(complaint).data)


# ─── Hierarchy: Officer management by level ──────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsHierarchyOfficer])
def create_subordinate_officer(request):
    """Any hierarchy officer can create officers below them."""
    user = request.user
    data = request.data

    # Determine what roles this user can create
    CREATABLE = {
        "PM": ["CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER"],
        "ADMIN": ["CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER"],
        "CM": ["DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER"],
        "DISTRICT_OFFICER": ["BLOCK_OFFICER", "FIELD_OFFICER"],
        "BLOCK_OFFICER": ["FIELD_OFFICER"],
    }
    allowed_roles = CREATABLE.get(user.role, [])
    target_role = data.get("role", "FIELD_OFFICER")

    if target_role not in allowed_roles:
        return Response({"error": f"You cannot create a {target_role}"}, status=403)

    if User.objects.filter(username=data.get("username")).exists():
        return Response({"error": "Username already exists."}, status=400)

    dept = None
    if data.get("department_id"):
        dept = get_object_or_404(Department, id=data["department_id"])

    new_user = User.objects.create_user(
        username=data["username"],
        email=data.get("email", ""),
        password=data["password"],
        role=target_role,
        phone=data.get("phone", ""),
        department=dept,
        employee_id=data.get("employee_id") or None,
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        state=data.get("state", ""),
        district=data.get("district", ""),
        block=data.get("block", ""),
        created_by=user,
    )
    return Response(UserSerializer(new_user).data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsHierarchyOfficer])
def my_subordinates(request):
    """Get officers this user can forward work to: direct reports and department peers."""
    subs = (
        User.objects
        .filter(_department_peer_filter(request.user))
        .exclude(id=request.user.id)
        .exclude(role__in=["CITIZEN", "ADMIN", "PM"])
        .distinct()
    )
    return Response(UserSerializer(subs, many=True).data)


# ─── Hierarchy Complaint Views ────────────────────────────────────────────────

class HierarchyComplaintListView(generics.ListAPIView):
    """Department/nodal complaints owned by this officer, plus forwarded work."""
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsHierarchyOfficer]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("PM", "ADMIN"):
            qs = Complaint.objects.all()
        else:
            qs = Complaint.objects.filter(_complaint_owner_filter(user))
        qs = qs.prefetch_related("history", "forwarding_records")

        status_f = self.request.query_params.get("status")
        priority_f = self.request.query_params.get("priority")
        search = self.request.query_params.get("search")
        if status_f:
            qs = qs.filter(status=status_f)
        if priority_f:
            qs = qs.filter(priority=priority_f)
        if search:
            qs = qs.filter(Q(ticket_id__icontains=search) | Q(title__icontains=search))
        return qs


class HierarchyComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = OfficerComplaintUpdateSerializer
    permission_classes = [IsAuthenticated, IsHierarchyOfficer]

    def get_queryset(self):
        return Complaint.objects.filter(_complaint_owner_filter(self.request.user))

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        complaint = serializer.save()
        if complaint.status == "RESOLVED":
            complaint.resolved_at = timezone.now()
            complaint.save(update_fields=["resolved_at"])
        ComplaintHistory.objects.create(
            complaint=complaint,
            changed_by=self.request.user,
            old_status=old_status,
            new_status=complaint.status,
            note=complaint.officer_remarks,
        )
        notif_type = "RESOLVED" if complaint.status == "RESOLVED" else "STATUS_UPDATE"
        _notify(complaint.citizen, complaint, notif_type,
                f"Update on #{complaint.ticket_id}",
                f"Status updated to: {complaint.get_status_display()}")


# ─── Admin Views ──────────────────────────────────────────────────────────────

class AdminComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = Complaint.objects.all().prefetch_related("history", "forwarding_records")
        status_f = self.request.query_params.get("status")
        dept_f = self.request.query_params.get("department")
        priority_f = self.request.query_params.get("priority")
        search = self.request.query_params.get("search")
        if status_f:
            qs = qs.filter(status=status_f)
        if dept_f:
            qs = qs.filter(department_id=dept_f)
        if priority_f:
            qs = qs.filter(priority=priority_f)
        if search:
            qs = qs.filter(
                Q(ticket_id__icontains=search) | Q(title__icontains=search) | Q(description__icontains=search)
            )
        return qs


class AdminComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = AdminComplaintUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Complaint.objects.all()

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        old_officer = old.assigned_officer
        complaint = serializer.save()
        if complaint.assigned_officer and complaint.assigned_officer != old_officer:
            complaint.forwarded_to = complaint.assigned_officer
            complaint.current_level = "DEPARTMENT" if Department.objects.filter(head_officer=complaint.assigned_officer, is_active=True).exists() else ROLE_LEVEL_MAP.get(complaint.assigned_officer.role, "FIELD")
            if complaint.status == "PENDING":
                complaint.status = "ASSIGNED"
            complaint.save(update_fields=["forwarded_to", "current_level", "status"])
            ForwardingRecord.objects.create(
                complaint=complaint,
                from_user=self.request.user,
                to_user=complaint.assigned_officer,
                from_level="ADMIN",
                to_level=complaint.current_level,
                action="ASSIGN",
                note=complaint.admin_override_note or "Assigned by admin.",
            )
        if old_status != complaint.status:
            ComplaintHistory.objects.create(
                complaint=complaint,
                changed_by=self.request.user,
                old_status=old_status,
                new_status=complaint.status,
                note=complaint.admin_override_note,
            )
            _notify(complaint.citizen, complaint, "STATUS_UPDATE",
                    f"Complaint #{complaint.ticket_id} Updated",
                    f"Status changed to {complaint.get_status_display()}")
        if complaint.assigned_officer:
            _notify(complaint.assigned_officer, complaint, "ASSIGNED",
                    f"New Complaint Assigned: #{complaint.ticket_id}",
                    f"Please review and take action on {complaint.title}")


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total = Complaint.objects.count()
        by_status = dict(Complaint.objects.values_list("status").annotate(c=Count("id")))
        by_priority = dict(Complaint.objects.values_list("priority").annotate(c=Count("id")))
        by_dept = list(Complaint.objects.values("department__name").annotate(count=Count("id")).order_by("-count")[:10])
        by_category = dict(Complaint.objects.values_list("category").annotate(c=Count("id")))
        avg_rating = Complaint.objects.filter(citizen_rating__isnull=False).aggregate(avg=Avg("citizen_rating"))["avg"]
        sla_breached = Complaint.objects.filter(is_sla_breached=True).count()
        by_level = dict(Complaint.objects.values_list("current_level").annotate(c=Count("id")))
        return Response({
            "total": total,
            "by_status": by_status,
            "by_priority": by_priority,
            "by_department": by_dept,
            "by_category": by_category,
            "average_rating": round(avg_rating or 0, 2),
            "sla_breached": sla_breached,
            "pending": by_status.get("PENDING", 0),
            "resolved": by_status.get("RESOLVED", 0),
            "by_level": by_level,
        })


class AdminUserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        role = self.request.query_params.get("role")
        qs = User.objects.all()
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()


class AdminCreateOfficerView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        data = request.data
        if User.objects.filter(username=data.get("username")).exists():
            return Response({"error": "Username already exists."}, status=400)
        dept = get_object_or_404(Department, id=data.get("department_id")) if data.get("department_id") else None
        user = User.objects.create_user(
            username=data["username"],
            email=data.get("email", ""),
            password=data["password"],
            role=data.get("role", "FIELD_OFFICER"),
            phone=data.get("phone", ""),
            department=dept,
            employee_id=data.get("employee_id") or None,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            state=data.get("state", ""),
            district=data.get("district", ""),
            block=data.get("block", ""),
            created_by=request.user,
        )
        return Response(UserSerializer(user).data, status=201)


# ─── Officer Views (legacy field officer) ────────────────────────────────────

class OfficerComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(
            _complaint_owner_filter(self.request.user)
        ).prefetch_related("history", "forwarding_records")


class OfficerComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = OfficerComplaintUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(_complaint_owner_filter(self.request.user))

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        complaint = serializer.save()
        if complaint.status == "RESOLVED":
            complaint.resolved_at = timezone.now()
            complaint.save(update_fields=["resolved_at"])
        ComplaintHistory.objects.create(
            complaint=complaint,
            changed_by=self.request.user,
            old_status=old_status,
            new_status=complaint.status,
            note=complaint.officer_remarks,
        )
        _notify(complaint.citizen, complaint, "STATUS_UPDATE",
                f"Update on #{complaint.ticket_id}",
                f"Officer updated status to: {complaint.get_status_display()}")


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
    notif.is_read = True
    notif.save()
    return Response({"status": "ok"})


# ─── Public tracking ─────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def track_complaint(request, ticket_id):
    complaint = get_object_or_404(Complaint, ticket_id=ticket_id.upper())
    forwarding = ForwardingRecord.objects.filter(complaint=complaint).select_related("from_user", "to_user")
    trail = [
        {
            "from": f.from_user.get_full_name() or f.from_user.username if f.from_user else "System",
            "to": f.to_user.get_full_name() or f.to_user.username if f.to_user else "Unknown",
            "from_level": f.from_level,
            "to_level": f.to_level,
            "action": f.action,
            "note": f.note,
            "date": f.created_at,
        }
        for f in forwarding
    ]
    return Response({
        "ticket_id": complaint.ticket_id,
        "title": complaint.title,
        "status": complaint.status,
        "priority": complaint.priority,
        "category": complaint.category,
        "department": complaint.department.name if complaint.department else None,
        "current_level": complaint.current_level,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "sla_deadline": complaint.sla_deadline,
        "is_sla_breached": complaint.is_sla_breached,
        "forwarding_trail": trail,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def run_demo_seed(request):
    token = request.headers.get("X-Demo-Seed-Token") or request.data.get("token")
    expected = getattr(settings, "DEMO_SEED_TOKEN", "")
    if not expected or token != expected:
        return Response({"detail": "Invalid seed token."}, status=403)

    call_command("seed")
    return Response({
        "status": "ok",
        "message": "Demo departments, users, nodal mappings, and grievances were seeded.",
        "logins": {
            "admin": "Admin@1234",
            "citizen_demo": "Citizen@1234",
            "nodal_electricity": "Officer@1234",
            "district_officer": "Officer@1234",
        },
    })


# ─── Helper ───────────────────────────────────────────────────────────────────

def _notify(user, complaint, notif_type, title, message):
    Notification.objects.create(
        recipient=user,
        complaint=complaint,
        notification_type=notif_type,
        title=title,
        message=message,
    )
