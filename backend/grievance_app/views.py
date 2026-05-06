from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404

from .models import User, Department, Complaint, ComplaintHistory, Notification
from .serializers import (
    RegisterSerializer, UserSerializer, DepartmentSerializer,
    ComplaintSerializer, ComplaintCreateSerializer, NotificationSerializer,
    AdminComplaintUpdateSerializer, OfficerComplaintUpdateSerializer, CitizenFeedbackSerializer,
)
from .permissions import IsAdmin, IsOfficer, IsCitizen


# ─── Auth ───────────────────────────────────────────────────────────────────


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Departments ────────────────────────────────────────────────────────────


class DepartmentListView(generics.ListCreateAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [IsAuthenticated()]


class DepartmentDetailView(generics.RetrieveAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


# ─── Citizen Complaints ─────────────────────────────────────────────────────


class CitizenComplaintListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCitizen]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user).prefetch_related("history")

    def perform_create(self, serializer):
        complaint = serializer.save(citizen=self.request.user)
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


# ─── Admin Views ────────────────────────────────────────────────────────────


class AdminComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = Complaint.objects.all().prefetch_related("history")
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
                Q(ticket_id__icontains=search) |
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        return qs


class AdminComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = AdminComplaintUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Complaint.objects.all()

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        complaint = serializer.save()
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
        by_dept = list(
            Complaint.objects.values("department__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        by_category = dict(Complaint.objects.values_list("category").annotate(c=Count("id")))
        avg_rating = Complaint.objects.filter(
            citizen_rating__isnull=False
        ).aggregate(avg=Avg("citizen_rating"))["avg"]
        sla_breached = Complaint.objects.filter(is_sla_breached=True).count()
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


class AdminCreateOfficerView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        data = request.data
        if User.objects.filter(username=data.get("username")).exists():
            return Response({"error": "Username already exists."}, status=400)
        dept = get_object_or_404(Department, id=data.get("department_id"))
        user = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
            role="OFFICER",
            phone=data.get("phone", ""),
            department=dept,
            employee_id=data.get("employee_id", ""),
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
        )
        return Response(UserSerializer(user).data, status=201)


# ─── Officer Views ──────────────────────────────────────────────────────────


class OfficerComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsOfficer]

    def get_queryset(self):
        return Complaint.objects.filter(
            assigned_officer=self.request.user
        ).prefetch_related("history")


class OfficerComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = OfficerComplaintUpdateSerializer
    permission_classes = [IsAuthenticated, IsOfficer]

    def get_queryset(self):
        return Complaint.objects.filter(assigned_officer=self.request.user)

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


# ─── Notifications ──────────────────────────────────────────────────────────


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


# ─── Ticket Tracking (public) ───────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def track_complaint(request, ticket_id):
    complaint = get_object_or_404(Complaint, ticket_id=ticket_id.upper())
    return Response({
        "ticket_id": complaint.ticket_id,
        "title": complaint.title,
        "status": complaint.status,
        "priority": complaint.priority,
        "category": complaint.category,
        "department": complaint.department.name if complaint.department else None,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "sla_deadline": complaint.sla_deadline,
        "is_sla_breached": complaint.is_sla_breached,
    })


# ─── Helper ─────────────────────────────────────────────────────────────────


def _notify(user, complaint, notif_type, title, message):
    Notification.objects.create(
        recipient=user,
        complaint=complaint,
        notification_type=notif_type,
        title=title,
        message=message,
    )
