import secrets
import logging
import random

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from django.core.management import call_command
from django.core.mail import get_connection, send_mail
from django.utils import timezone
from django.db import DatabaseError, IntegrityError, transaction
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404

from .models import User, Department, Complaint, ComplaintHistory, LoginOTP, Notification, ForwardingRecord
from .serializers import (
    RegisterSerializer, UserSerializer, ProfileUpdateSerializer, DepartmentSerializer,
    ComplaintSerializer, ComplaintCreateSerializer, NotificationSerializer,
    AdminComplaintUpdateSerializer, OfficerComplaintUpdateSerializer,
    CitizenFeedbackSerializer, ForwardingRecordSerializer, ChangePasswordSerializer,
)
from .permissions import IsAdmin, IsCitizen, IsHierarchyOfficer


DEFAULT_OFFICER_ROLE = "OFFICER"
logger = logging.getLogger(__name__)


def _demo_maintenance_token(request):
    token = request.headers.get("X-Demo-Seed-Token") or request.data.get("token") or ""
    return str(token).strip()


def _valid_demo_maintenance_token(request):
    expected = str(getattr(settings, "DEMO_SEED_TOKEN", "") or "").strip()
    token = _demo_maintenance_token(request)
    return bool(expected and token and secrets.compare_digest(token, expected))


def _can_run_demo_maintenance(request):
    user = getattr(request, "user", None)
    return _valid_demo_maintenance_token(request) or (
        user and user.is_authenticated and (user.role == "ADMIN" or user.is_superuser)
    )


def _token_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def _deliver_email_otp(otp, user, subject, message):
    def save_delivery_note(note):
        # Keep this below the old varchar(255) schema too, so registration
        # remains safe even while a Render deploy is between code and migrate.
        try:
            otp.delivery_note = str(note or "")[:240]
            otp.save(update_fields=["delivery_note"])
        except Exception as exc:
            logger.warning("Could not save OTP delivery note for user %s: %s", user.username, exc)

    try:
        if not user.email:
            delivery_note = "No email on account."
            save_delivery_note(delivery_note)
            return False, delivery_note

        if (
            settings.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
            and settings.EMAIL_HOST == "smtp.gmail.com"
            and (not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD)
        ):
            delivery_note = "Email is not configured. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD."
            save_delivery_note(delivery_note)
            return False, delivery_note

        connection = get_connection(timeout=getattr(settings, "EMAIL_TIMEOUT", 10))
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            connection=connection,
        )
        delivery_note = "Email sent."
        save_delivery_note(delivery_note)
        return True, delivery_note
    except Exception as exc:
        logger.exception("Email OTP failed for user %s", user.username)
        delivery_note = f"Email failed: {exc}"
        save_delivery_note(delivery_note)
        return False, delivery_note


def _registration_email_configured():
    if settings.EMAIL_BACKEND != "django.core.mail.backends.smtp.EmailBackend":
        return True
    if settings.EMAIL_HOST == "smtp.gmail.com":
        return bool(settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD)
    return True


def _create_and_send_registration_otp(user):
    recent_otp = LoginOTP.objects.filter(
        user=user,
        created_at__gte=timezone.now() - timezone.timedelta(seconds=60),
        consumed_at__isnull=True,
    ).order_by("-created_at").first()
    if recent_otp:
        return recent_otp, False, "Please wait before requesting another OTP."

    LoginOTP.objects.filter(user=user, consumed_at__isnull=True).update(consumed_at=timezone.now())
    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    expires_at = timezone.now() + timezone.timedelta(minutes=10)
    message = f"Your Jan Samadhan AI email verification OTP is {code}. It expires in 10 minutes."
    otp = LoginOTP.objects.create(user=user, code=code, expires_at=expires_at)
    email_sent, delivery_note = _deliver_email_otp(otp, user, "Verify your Jan Samadhan AI email", message)
    return otp, email_sent, delivery_note


def _send_complaint_submission_email(complaint):
    user = complaint.citizen
    if not user.email:
        return False, "No email on account."

    if (
        settings.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
        and settings.EMAIL_HOST == "smtp.gmail.com"
        and (not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD)
    ):
        return False, "Email is not configured. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD."

    track_url = f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}/track/{complaint.ticket_id}" if getattr(settings, "FRONTEND_URL", "") else ""
    message_lines = [
        f"Your complaint has been submitted successfully.",
        "",
        f"Tracking ID: {complaint.ticket_id}",
        f"Title: {complaint.title}",
        f"Status: {complaint.get_status_display()}",
    ]
    if complaint.department:
        message_lines.append(f"Department: {complaint.department.name}")
    if track_url:
        message_lines.extend(["", f"Track your complaint here: {track_url}"])

    try:
        connection = get_connection(timeout=getattr(settings, "EMAIL_TIMEOUT", 10))
        send_mail(
            f"Complaint submitted: #{complaint.ticket_id}",
            "\n".join(message_lines),
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            connection=connection,
        )
        return True, "Email sent."
    except Exception as exc:
        logger.exception("Complaint submission email failed for complaint %s", complaint.ticket_id)
        return False, f"Email failed: {exc}"


def _send_staff_credentials_email(user, raw_password, creator=None):
    if not user.email:
        return False, "No email on officer account."

    if (
        settings.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
        and settings.EMAIL_HOST == "smtp.gmail.com"
        and (not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD)
    ):
        return False, "Email is not configured. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD."

    creator_name = ""
    if creator:
        creator_name = creator.get_full_name() or creator.username
    login_url = getattr(settings, "FRONTEND_URL", "").rstrip("/") or "https://jan-samadhan.vercel.app"
    lines = [
        "Your Jan Samadhan AI staff account has been created.",
        "",
        f"Role: {user.get_role_display()}",
        f"Name: {user.get_full_name() or user.username}",
        f"Username: {user.username}",
        f"Email: {user.email}",
        f"Password: {raw_password}",
        f"Login URL: {login_url}/login",
    ]
    if user.department:
        lines.append(f"Department: {user.department.name}")
    if creator_name:
        lines.append(f"Created by: {creator_name}")
    lines.extend([
        "",
        "Please sign in and change your password from Profile after first login.",
    ])

    try:
        connection = get_connection(timeout=getattr(settings, "EMAIL_TIMEOUT", 10))
        send_mail(
            "Jan Samadhan AI staff account credentials",
            "\n".join(lines),
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            connection=connection,
        )
        return True, "Credentials email sent."
    except Exception as exc:
        logger.exception("Staff credentials email failed for user %s", user.username)
        return False, f"Email failed: {exc}"


def _activate_citizen_without_otp(user):
    user.is_active = True
    user.is_verified = True
    user.save(update_fields=["is_active", "is_verified"])


def _email_verification_required():
    return getattr(settings, "CITIZEN_EMAIL_VERIFICATION_REQUIRED", True) and _registration_email_configured()


def _otp_response_extra(otp, email_sent):
    if otp and not email_sent and getattr(settings, "EXPOSE_REGISTRATION_OTP_IN_RESPONSE", False):
        return {"dev_otp": otp.code}
    return {}


def _registration_exception_response(exc):
    logger.exception("Citizen registration failed")
    message = str(exc)[:300]
    status_code = status.HTTP_400_BAD_REQUEST if isinstance(exc, IntegrityError) else status.HTTP_500_INTERNAL_SERVER_ERROR
    return Response({
        "detail": f"Registration failed: {type(exc).__name__}: {message}",
        "error": message,
    }, status=status_code)


def _managed_department_ids(user):
    if not user or not user.is_authenticated:
        return set()
    if user.role == "ADMIN":
        return set(Department.objects.values_list("id", flat=True))

    managed = set(
        Department.objects.filter(is_active=True).filter(
            Q(head_officer=user) | Q(sub_head_officer=user)
        ).values_list("id", flat=True)
    )
    if not managed:
        return set()

    queue = list(managed)
    while queue:
        current_id = queue.pop(0)
        child_ids = list(
            Department.objects.filter(parent_id=current_id, is_active=True).values_list("id", flat=True)
        )
        for child_id in child_ids:
            if child_id not in managed:
                managed.add(child_id)
                queue.append(child_id)
    return managed


def _visible_department_queryset(user):
    if not user or not user.is_authenticated:
        return Department.objects.none()
    if user.role == "ADMIN":
        return Department.objects.filter(is_active=True)
    return Department.objects.filter(is_active=True).filter(
        Q(created_by=user) | Q(head_officer=user) | Q(sub_head_officer=user)
    ).distinct()


def _visible_user_queryset(user):
    if not user or not user.is_authenticated:
        return User.objects.none()
    if user.role == "ADMIN":
        return User.objects.all().distinct()
    return User.objects.filter(Q(id=user.id) | Q(created_by=user) | Q(reports_to=user)).distinct()


def _manageable_officer_queryset(user):
    if not user or not user.is_authenticated:
        return User.objects.none()
    if user.role == "ADMIN":
        return User.objects.exclude(role="CITIZEN").distinct()
    return User.objects.filter(Q(created_by=user) | Q(reports_to=user)).exclude(role="CITIZEN").exclude(id=user.id).distinct()


def _actor_level(user):
    if Department.objects.filter(Q(head_officer=user) | Q(sub_head_officer=user), is_active=True).exists():
        return "DEPARTMENT"
    if user.role == "ADMIN":
        return "ADMIN"
    return "OFFICER"


def _complaint_owner_filter(user):
    headed_departments = Department.objects.filter(Q(head_officer=user) | Q(sub_head_officer=user), is_active=True)
    q = Q(forwarded_to=user) | Q(assigned_officer=user)
    if headed_departments.exists():
        q |= Q(department__in=headed_departments)
    return q


def _department_peer_filter(user):
    q = Q(created_by=user)
    q |= Q(reports_to=user)
    if user.department_id:
        q |= Q(department_id=user.department_id)
    headed_departments = Department.objects.filter(Q(head_officer=user) | Q(sub_head_officer=user), is_active=True)
    if headed_departments.exists():
        q |= Q(department__in=headed_departments)
    return q


def _is_department_leader(user, department=None):
    if not user or not user.is_authenticated:
        return False
    managed_ids = _managed_department_ids(user)
    if not managed_ids:
        return False
    if department:
        return department.id in managed_ids
    return True


def _can_create_role(creator, target_role, department=None):
    if target_role == "ADMIN":
        return creator.role == "ADMIN"
    if target_role == "CITIZEN":
        return False
    if creator.role == "ADMIN":
        return True
    return creator.role == "OFFICER"


def _build_user_payload(data, creator):
    dept = get_object_or_404(Department, id=data["department_id"]) if data.get("department_id") else None
    target_role = data.get("role", DEFAULT_OFFICER_ROLE)
    if not _can_create_role(creator, target_role, dept):
        return None, Response({"error": f"You cannot create a {target_role} under your current hierarchy."}, status=403)

    email = str(data.get("email", "")).strip().lower()
    username = str(data.get("username") or email).strip().lower()
    if not email:
        return None, Response({"error": "Email is required for officer login and credentials delivery."}, status=400)
    if User.objects.filter(Q(username=username) | Q(email=email)).exists():
        return None, Response({"error": "An account with this email already exists."}, status=400)

    reports_to = creator
    if data.get("reports_to"):
        reports_to = get_object_or_404(User, id=data["reports_to"])
    elif dept and dept.head_officer and creator.role == "ADMIN":
        reports_to = dept.head_officer

    payload = {
        "username": username,
        "email": email,
        "password": data["password"],
        "role": target_role,
        "phone": data.get("phone", ""),
        "department": dept,
        "employee_id": data.get("employee_id") or None,
        "first_name": data.get("first_name", ""),
        "last_name": data.get("last_name", ""),
        "designation": data.get("designation", ""),
        "state": data.get("state", ""),
        "district": data.get("district", ""),
        "block": data.get("block", ""),
        "created_by": creator,
        "reports_to": reports_to,
        "is_verified": bool(data.get("is_verified", True)),
        "is_active": bool(data.get("is_active", True)),
    }
    return payload, None


def _escalation_target(user, complaint):
    if user.reports_to_id and user.reports_to and user.reports_to.is_active:
        return user.reports_to, "REPORTING_MANAGER"

    if user.department_id:
        parent_department = Department.objects.filter(id=user.department.parent_id, is_active=True).first() if user.department and user.department.parent_id else None
        if parent_department:
            candidate = parent_department.head_officer or parent_department.sub_head_officer
            if candidate and candidate.is_active:
                return candidate, "PARENT_DEPARTMENT"

    creator = user.created_by
    if creator and creator.is_active and creator.role != "CITIZEN":
        return creator, "CREATOR"

    admin = User.objects.filter(role="ADMIN", is_active=True).exclude(id=user.id).first()
    if admin:
        return admin, "ADMIN"

    return None, None


def _can_manage_department(user, department=None, parent=None):
    if not user or not user.is_authenticated:
        return False
    if user.role == "ADMIN":
        return True
    managed_ids = _managed_department_ids(user)
    if department and department.id in managed_ids:
        return True
    if parent and parent.id in managed_ids:
        return True
    return False


# ─── Auth ───────────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=400)

        candidate = User.objects.filter(Q(username=username) | Q(email=username)).first()
        if candidate and not candidate.is_active and candidate.role == "CITIZEN":
            return Response({"detail": "Please verify your email OTP before signing in."}, status=403)

        user = authenticate(request, username=candidate.username if candidate else username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=401)

        return Response(_token_response(user))


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            username = request.data.get("username", "").strip()
            email = request.data.get("email", "").strip()
            existing_user = User.objects.filter(role="CITIZEN").filter(Q(username=username) | Q(email=email)).first()
            if existing_user:
                if existing_user.is_active and existing_user.is_verified:
                    return Response({"detail": "A verified account already exists. Please sign in."}, status=400)

                if not _email_verification_required():
                    _activate_citizen_without_otp(existing_user)
                    return Response({
                        "verification_required": False,
                        "detail": "Account verified. Please sign in.",
                        "username": existing_user.username,
                        "email": existing_user.email,
                    }, status=status.HTTP_200_OK)

                otp, email_sent, delivery_note = _create_and_send_registration_otp(existing_user)
                return Response({
                    "verification_required": True,
                    "email_sent": email_sent,
                    "detail": "This account is waiting for email verification. OTP resent." if email_sent else "This account is waiting for email verification, but OTP email could not be sent.",
                    "delivery_note": delivery_note,
                    "username": existing_user.username,
                    "email": existing_user.email,
                    **_otp_response_extra(otp, email_sent),
                }, status=status.HTTP_200_OK)

            if User.objects.filter(Q(username=username) | Q(email=email)).exists():
                return Response({"detail": "This email is already used by another account. Please sign in."}, status=400)

            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                user = serializer.save()
                if not _email_verification_required():
                    _activate_citizen_without_otp(user)
                    return Response({
                        "verification_required": False,
                        "detail": "Account created. Please sign in.",
                        "username": user.username,
                        "email": user.email,
                    }, status=status.HTTP_201_CREATED)

                otp, email_sent, delivery_note = _create_and_send_registration_otp(user)
            return Response({
                "verification_required": True,
                "email_sent": email_sent,
                "detail": "Account created. OTP sent to your email for verification." if email_sent else "Account created, but OTP email could not be sent.",
                "delivery_note": delivery_note,
                "username": user.username,
                "email": user.email,
                **_otp_response_extra(otp, email_sent),
            }, status=status.HTTP_201_CREATED)
        except (DatabaseError, IntegrityError, Exception) as exc:
            return _registration_exception_response(exc)


class ResendRegistrationOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        email = request.data.get("email", "").strip()
        if not username and not email:
            return Response({"detail": "Email is required."}, status=400)

        user = User.objects.filter(role="CITIZEN").filter(Q(username=username) | Q(email=email)).first()
        if not user:
            return Response({"detail": "Account not found."}, status=404)
        if user.is_active and user.is_verified:
            return Response({"detail": "Account is already verified."}, status=400)

        otp, email_sent, delivery_note = _create_and_send_registration_otp(user)
        status_code = status.HTTP_200_OK if email_sent else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response({
            "email_sent": email_sent,
            "detail": "OTP resent to your email." if email_sent else "OTP email could not be sent.",
            "delivery_note": delivery_note,
            "username": user.username,
            "email": user.email,
            **_otp_response_extra(otp, email_sent),
        }, status=status_code)


class VerifyRegistrationOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        code = request.data.get("otp", "").strip()
        if not username or not code:
            return Response({"detail": "Username and OTP are required."}, status=400)

        user = User.objects.filter(username=username, role="CITIZEN").first()
        if not user:
            return Response({"detail": "Account not found."}, status=404)
        if user.is_active and user.is_verified:
            return Response({"detail": "Account is already verified."})

        otp = LoginOTP.objects.filter(
            user=user,
            code=code,
            consumed_at__isnull=True,
            expires_at__gte=timezone.now(),
        ).order_by("-created_at").first()
        if not otp:
            return Response({"detail": "Invalid or expired OTP."}, status=400)

        otp.consumed_at = timezone.now()
        otp.save(update_fields=["consumed_at"])
        user.is_active = True
        user.is_verified = True
        user.save(update_fields=["is_active", "is_verified"])
        return Response({
            "status": "ok",
            "detail": "Email verified. You are signed in now.",
            **_token_response(user),
        })


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return ProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed successfully."})


# ─── Departments ─────────────────────────────────────────────────────────────

class DepartmentListView(generics.ListCreateAPIView):
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsHierarchyOfficer()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return _visible_department_queryset(self.request.user)

    def perform_create(self, serializer):
        parent = None
        parent_id = self.request.data.get("parent")
        if parent_id:
            parent = get_object_or_404(Department, id=parent_id, is_active=True)
        if not _can_manage_department(self.request.user, parent=parent):
            raise PermissionDenied("You cannot create a department under this branch.")
        serializer.save(created_by=self.request.user, parent=parent)


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        return _visible_department_queryset(self.request.user)

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsHierarchyOfficer()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        department = self.get_object()
        parent = department.parent
        parent_id = self.request.data.get("parent")
        if parent_id:
            parent = get_object_or_404(Department, id=parent_id)
        elif "parent" in self.request.data and not parent_id:
            parent = None

        if not _can_manage_department(self.request.user, department=department, parent=parent):
            raise PermissionDenied("You cannot update this department.")

        serializer.save(parent=parent)

    def perform_destroy(self, instance):
        if not _can_manage_department(self.request.user, department=instance, parent=instance.parent):
            raise PermissionDenied("You cannot delete this department.")
        instance.is_active = False
        instance.save(update_fields=["is_active"])


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
            initial_level = complaint.current_level or "DEPARTMENT"
            initial_note = (
                "Auto-routed to the nearest available branch officer under the mapped department."
                if initial_level == "OFFICER"
                else "Auto-routed to department head or department desk."
            )
            ForwardingRecord.objects.create(
                complaint=complaint,
                from_user=None,
                to_user=complaint.assigned_officer,
                from_level="SYSTEM",
                to_level=initial_level,
                action="ASSIGN",
                note=initial_note,
            )
            ComplaintHistory.objects.create(
                complaint=complaint,
                changed_by=None,
                old_status="PENDING",
                new_status=complaint.status,
                note=initial_note,
            )
            _notify(complaint.assigned_officer, complaint, "ASSIGNED",
                    f"New Department Grievance: #{complaint.ticket_id}",
                    f"A new grievance was routed to you under {complaint.department.name}.")
        _notify(complaint.citizen, complaint, "ASSIGNED",
                "Complaint Received",
                f"Your complaint #{complaint.ticket_id} has been submitted successfully. Use this tracking ID to check complaint status.")
        email_sent, email_note = _send_complaint_submission_email(complaint)
        if not email_sent:
            logger.warning("Complaint submission email not sent for %s: %s", complaint.ticket_id, email_note)


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
    to_level = "DEPARTMENT" if Department.objects.filter(Q(head_officer=to_user) | Q(sub_head_officer=to_user), is_active=True).exists() else "OFFICER"

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
    complaint.current_level = to_level
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
            f"Your complaint has been forwarded to {to_user.get_full_name() or to_user.username} for action.")

    return Response(ComplaintSerializer(complaint).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsHierarchyOfficer])
def escalate_complaint(request, pk):
    """Escalate complaint UP the hierarchy."""
    complaint = get_object_or_404(Complaint, pk=pk)
    note = request.data.get("note", "")
    user = request.user

    from_level = _actor_level(user)
    to_user, escalation_path = _escalation_target(user, complaint)
    if not to_user:
        return Response({"error": "No higher officer is available in this reporting chain."}, status=400)
    to_level = "DEPARTMENT" if Department.objects.filter(Q(head_officer=to_user) | Q(sub_head_officer=to_user), is_active=True).exists() else "OFFICER"

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
        note=f"Escalated from {from_level} to {to_level} via {escalation_path}. {note}",
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
    """Create a subordinate officer under the current reporting chain."""
    user = request.user
    data = request.data
    payload, error_response = _build_user_payload(data, user)
    if error_response:
        return error_response
    raw_password = payload["password"]
    new_user = User.objects.create_user(**payload)
    email_sent, email_note = _send_staff_credentials_email(new_user, raw_password, creator=user)
    response_data = UserSerializer(new_user).data
    response_data["credentials_email_sent"] = email_sent
    response_data["credentials_email_note"] = email_note
    return Response(response_data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsHierarchyOfficer])
def my_subordinates(request):
    """Get officers this user can forward work to: direct reports and department peers."""
    subs = (
        User.objects
        .filter(_department_peer_filter(request.user))
        .exclude(id=request.user.id)
        .exclude(role="CITIZEN")
        .distinct()
    )
    return Response(UserSerializer(subs, many=True).data)


class HierarchyOfficerDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsHierarchyOfficer]

    def get_queryset(self):
        return _manageable_officer_queryset(self.request.user)

    def perform_update(self, serializer):
        user = serializer.save()
        password = self.request.data.get("password")
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])


# ─── Hierarchy Complaint Views ────────────────────────────────────────────────

class HierarchyComplaintListView(generics.ListAPIView):
    """Department complaints owned by this officer, plus forwarded work."""
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsHierarchyOfficer]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
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
            complaint.current_level = "DEPARTMENT" if Department.objects.filter(Q(head_officer=complaint.assigned_officer) | Q(sub_head_officer=complaint.assigned_officer), is_active=True).exists() else "OFFICER"
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
        qs = _visible_user_queryset(self.request.user)
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return _visible_user_queryset(self.request.user)

    def perform_update(self, serializer):
        user = serializer.save()
        password = self.request.data.get("password")
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])


class AdminCreateOfficerView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        data = request.data
        payload, error_response = _build_user_payload(data, request.user)
        if error_response:
            return error_response
        raw_password = payload["password"]
        user = User.objects.create_user(**payload)
        email_sent, email_note = _send_staff_credentials_email(user, raw_password, creator=request.user)
        response_data = UserSerializer(user).data
        response_data["credentials_email_sent"] = email_sent
        response_data["credentials_email_note"] = email_note
        return Response(response_data, status=201)


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
        "assigned_officer": (
            complaint.assigned_officer.get_full_name() or complaint.assigned_officer.username
            if complaint.assigned_officer else None
        ),
        "supervising_head": (
            (
                (complaint.department.head_officer or complaint.department.sub_head_officer).get_full_name()
                or (complaint.department.head_officer or complaint.department.sub_head_officer).username
            )
            if complaint.department and (complaint.department.head_officer or complaint.department.sub_head_officer)
            else None
        ),
        "current_level": complaint.current_level,
        "original_language": complaint.original_language,
        "translated_description": complaint.translated_description,
        "state": complaint.state,
        "district": complaint.district,
        "block": complaint.block,
        "location": complaint.location,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "is_duplicate": complaint.is_duplicate,
        "duplicate_of": complaint.duplicate_of.ticket_id if complaint.duplicate_of else None,
        "resolved_at": complaint.resolved_at,
        "officer_remarks": complaint.officer_remarks,
        "citizen_rating": complaint.citizen_rating,
        "citizen_feedback": complaint.citizen_feedback,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "sla_deadline": complaint.sla_deadline,
        "is_sla_breached": complaint.is_sla_breached,
        "forwarding_trail": trail,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def run_demo_seed(request):
    if not _can_run_demo_maintenance(request):
        return Response({"detail": "Invalid seed token."}, status=403)

    try:
        call_command("seed")
    except Exception:
        return Response(
            {"detail": "Seed failed. Check server logs for details."},
            status=500,
        )
    return Response({
        "status": "ok",
        "message": "National-to-village water department demo hierarchy, citizens, and grievances were seeded.",
        "logins": {
            "admin": getattr(settings, "DEFAULT_ADMIN_PASSWORD", "12345678"),
            "chief_public_grievance": "Officer@1234",
            "central_water_mission_head": "Officer@1234",
            "up_water_director": "Officer@1234",
            "lucknow_division_head": "Officer@1234",
            "lucknow_district_water_head": "Officer@1234",
            "bkt_block_water_head": "Officer@1234",
            "itaunja_panchayat_head": "Officer@1234",
            "nabinagar_village_operator": "Officer@1234",
            "malihabad_block_water_head": "Officer@1234",
            "rahimabad_panchayat_head": "Officer@1234",
            "hasanapur_village_operator": "Officer@1234",
            "citizen_rahul": "Citizen@1234",
            "citizen_aisha": "Citizen@1234",
            "citizen_neha": "Citizen@1234",
        },
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def run_admin_setup_seed(request):
    if not _can_run_demo_maintenance(request):
        return Response({"detail": "Invalid seed token."}, status=403)

    try:
        call_command("seed_admin_setup")
    except Exception:
        logger.exception("Admin setup seed failed")
        return Response(
            {"detail": "Admin setup failed. Check server logs for details."},
            status=500,
        )

    departments = list(
        Department.objects.filter(
            code__in=[
                "WATER", "ELECTRICITY", "SANITATION", "ROADS", "HEALTH",
                "EDUCATION", "PUBLIC_SERVICES", "DRAINAGE", "STREET_LIGHT", "WASTE_MGMT",
            ]
        ).values("name", "code", "head_officer__username")
    )
    return Response({
        "status": "ok",
        "message": "10 departments and 10 department officers are ready for admin management.",
        "officer_password": "Officer@1234",
        "departments": departments,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def run_demo_clear(request):
    if not _can_run_demo_maintenance(request):
        return Response({"detail": "Invalid seed token."}, status=403)

    call_command("clear_demo_data")
    return Response({
        "status": "ok",
        "message": "Seeded demo hierarchy data was deleted. Admin was kept.",
        "remaining_login": {
            "admin": getattr(settings, "DEFAULT_ADMIN_PASSWORD", "12345678"),
        },
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def run_clear_all_except_admin(request):
    if not _can_run_demo_maintenance(request):
        return Response({"detail": "Invalid clear token."}, status=403)

    call_command("clear_all_except_admin")
    admin_users = list(User.objects.filter(role="ADMIN").values_list("username", flat=True))
    return Response({
        "status": "ok",
        "message": "All non-admin data was deleted. Admin account(s) were kept.",
        "remaining_admins": admin_users,
        "known_admin_login": {
            "admin": getattr(settings, "DEFAULT_ADMIN_PASSWORD", "12345678"),
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
