from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings


class User(AbstractUser):
    ROLE_CHOICES = [
        ("CITIZEN", "Citizen"),
        ("ADMIN", "Admin"),
        ("PM", "PM / Super Admin"),
        ("CM", "CM / State Admin"),
        ("DISTRICT_OFFICER", "District Officer"),
        ("BLOCK_OFFICER", "Block Officer"),
        ("FIELD_OFFICER", "Field Officer"),
        ("OFFICER", "Officer"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="CITIZEN")
    designation = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    department = models.ForeignKey(
        "Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="officers"
    )
    employee_id = models.CharField(max_length=30, blank=True, unique=True, null=True)
    is_verified = models.BooleanField(default=False)
    state = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    block = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="subordinates"
    )
    reports_to = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="direct_reports"
    )

    class Meta:
        verbose_name = "User"

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def hierarchy_level(self):
        order = {"PM": 1, "ADMIN": 1, "CM": 2, "DISTRICT_OFFICER": 3, "BLOCK_OFFICER": 4, "FIELD_OFFICER": 5, "OFFICER": 5, "CITIZEN": 99}
        return order.get(self.role, 99)


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    head_officer = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="headed_departments"
    )
    sub_head_officer = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="sub_headed_departments"
    )
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Complaint(models.Model):
    PRIORITY_CHOICES = [("LOW","Low"),("MEDIUM","Medium"),("HIGH","High"),("CRITICAL","Critical")]
    STATUS_CHOICES = [
        ("PENDING","Pending"),("ASSIGNED","Assigned"),("FORWARDED","Forwarded"),
        ("IN_PROGRESS","In Progress"),("RESOLVED","Resolved"),("CLOSED","Closed"),
        ("ESCALATED","Escalated"),("REJECTED","Rejected"),
    ]
    CATEGORY_CHOICES = [
        ("ELECTRICITY","Electricity"),("WATER","Water Supply"),("SANITATION","Sanitation"),
        ("ROADS","Roads & Infrastructure"),("PUBLIC_SERVICES","Public Services"),
        ("HEALTH","Health"),("EDUCATION","Education"),("OTHER","Other"),
    ]
    LEVEL_CHOICES = [
        ("DEPARTMENT","Department / Nodal Officer"),
        ("PM","PM Level"),("CM","CM Level"),("DISTRICT","District Level"),
        ("BLOCK","Block Level"),("FIELD","Field Level"),
    ]

    ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name="complaints")
    title = models.CharField(max_length=255)
    description = models.TextField()
    original_language = models.CharField(max_length=20, default="en")
    translated_description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="OTHER")
    ai_category = models.CharField(max_length=30, blank=True)
    ai_confidence = models.FloatField(default=0.0)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="LOW")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="PENDING")
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL, related_name="complaints"
    )
    assigned_officer = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_complaints"
    )
    current_level = models.CharField(max_length=15, choices=LEVEL_CHOICES, default="DEPARTMENT")
    forwarded_to = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="forwarded_complaints"
    )
    state = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    block = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    attachment = models.FileField(upload_to="complaints/attachments/", blank=True, null=True)
    proof_of_resolution = models.FileField(upload_to="complaints/proofs/", blank=True, null=True)
    officer_remarks = models.TextField(blank=True)
    admin_override_note = models.TextField(blank=True)
    sla_deadline = models.DateTimeField(null=True, blank=True)
    is_sla_breached = models.BooleanField(default=False)
    citizen_rating = models.IntegerField(null=True, blank=True)
    citizen_feedback = models.TextField(blank=True)
    is_duplicate = models.BooleanField(default=False)
    duplicate_of = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="duplicates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            self.ticket_id = self._generate_ticket_id()
        if not self.sla_deadline and self.priority:
            hours = settings.SLA_HOURS.get(self.priority, 168)
            self.sla_deadline = timezone.now() + timezone.timedelta(hours=hours)
        super().save(*args, **kwargs)

    def _generate_ticket_id(self):
        import random, string
        prefix = "JS"
        rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        return f"{prefix}{rand}"

    def __str__(self):
        return f"{self.ticket_id} — {self.title[:50]}"

    class Meta:
        ordering = ["-created_at"]


class ForwardingRecord(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="forwarding_records")
    from_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="forwarded_from")
    to_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="forwarded_to_records")
    from_level = models.CharField(max_length=20)
    to_level = models.CharField(max_length=20)
    action = models.CharField(max_length=20, choices=[("FORWARD","Forward"),("ESCALATE","Escalate"),("ASSIGN","Assign")])
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.complaint.ticket_id}: {self.from_level} → {self.to_level}"


class ComplaintHistory(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="history")
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    old_status = models.CharField(max_length=15, blank=True)
    new_status = models.CharField(max_length=15, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.complaint.ticket_id}: {self.old_status} → {self.new_status}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("ASSIGNED","Complaint Assigned"),("STATUS_UPDATE","Status Updated"),
        ("SLA_BREACH","SLA Breached"),("ESCALATION","Escalated"),
        ("FORWARDED","Forwarded"),("RESOLVED","Resolved"),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.notification_type} → {self.recipient.username}"
