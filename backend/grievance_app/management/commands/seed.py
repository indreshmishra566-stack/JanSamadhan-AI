from django.core.management.base import BaseCommand
from django.utils import timezone

from grievance_app.models import Complaint, ComplaintHistory, Department, ForwardingRecord, Notification, User
from grievance_app.routing import apply_initial_grievance_routing
import os


class Command(BaseCommand):
    help = "Seed departments, demo users, nodal mappings, and sample grievances"

    def upsert_user(self, username, password, **defaults):
        user, created = User.objects.get_or_create(username=username, defaults=defaults)
        changed_fields = []
        for field, value in defaults.items():
            if getattr(user, field) != value:
                setattr(user, field, value)
                changed_fields.append(field)
        user.set_password(password)
        user.save()
        label = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"  {label} user: {username} / {password}"))
        return user

    def handle(self, *args, **kwargs):
        admin_password = os.environ.get("JAN_SAMADHAN_SEED_ADMIN_PASSWORD", "Admin@1234")
        officer_password = os.environ.get("JAN_SAMADHAN_SEED_OFFICER_PASSWORD", "Officer@1234")
        citizen_password = os.environ.get("JAN_SAMADHAN_SEED_CITIZEN_PASSWORD", "Citizen@1234")

        departments = [
            {"name": "Electricity Department", "code": "ELECTRICITY", "email": "electricity@jansamadhan.in"},
            {"name": "Water Supply Department", "code": "WATER", "email": "water@jansamadhan.in"},
            {"name": "Sanitation Department", "code": "SANITATION", "email": "sanitation@jansamadhan.in"},
            {"name": "Roads & Infrastructure", "code": "ROADS", "email": "roads@jansamadhan.in"},
            {"name": "Public Services", "code": "PUBLIC_SERVICES", "email": "public@jansamadhan.in"},
            {"name": "Health Department", "code": "HEALTH", "email": "health@jansamadhan.in"},
            {"name": "Education Department", "code": "EDUCATION", "email": "education@jansamadhan.in"},
            {"name": "General / Other", "code": "OTHER", "email": "general@jansamadhan.in"},
        ]
        for d in departments:
            obj, created = Department.objects.get_or_create(code=d["code"], defaults=d)
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Created dept: {obj.name}"))
            else:
                self.stdout.write(f"  Exists: {obj.name}")

        admin = self.upsert_user(
            "admin",
            admin_password,
            email="admin@jansamadhan.in",
            role="ADMIN",
            is_staff=True,
            is_superuser=True,
            is_verified=True,
            first_name="System",
            last_name="Administrator",
        )

        public_services = Department.objects.get(code="PUBLIC_SERVICES")
        pm_user = self.upsert_user(
            "pm_officer",
            officer_password,
            email="pm@jansamadhan.in",
            role="PM",
            is_staff=True,
            is_verified=True,
            first_name="Central",
            last_name="Authority",
        )
        cm_user = self.upsert_user(
            "cm_officer",
            officer_password,
            email="cm@jansamadhan.in",
            role="CM",
            is_staff=True,
            is_verified=True,
            state="Uttar Pradesh",
            first_name="State",
            last_name="Authority",
            created_by=pm_user,
        )
        district_user = self.upsert_user(
            "district_officer",
            officer_password,
            email="district@jansamadhan.in",
            role="DISTRICT_OFFICER",
            is_staff=True,
            is_verified=True,
            department=public_services,
            state="Uttar Pradesh",
            district="Lucknow",
            first_name="District",
            last_name="Officer",
            created_by=cm_user,
        )
        block_user = self.upsert_user(
            "block_officer",
            officer_password,
            email="block@jansamadhan.in",
            role="BLOCK_OFFICER",
            is_staff=True,
            is_verified=True,
            department=public_services,
            state="Uttar Pradesh",
            district="Lucknow",
            block="Chinhat",
            first_name="Block",
            last_name="Officer",
            created_by=district_user,
        )
        field_user = self.upsert_user(
            "field_officer",
            officer_password,
            email="field@jansamadhan.in",
            role="FIELD_OFFICER",
            is_staff=True,
            is_verified=True,
            department=public_services,
            state="Uttar Pradesh",
            district="Lucknow",
            block="Chinhat",
            first_name="Field",
            last_name="Officer",
            created_by=block_user,
        )

        for department in Department.objects.filter(is_active=True):
            username = f"nodal_{department.code.lower()}"
            officer = self.upsert_user(
                username,
                officer_password,
                email=department.email or f"{username}@jansamadhan.in",
                role="OFFICER",
                department=department,
                employee_id=f"NODAL-{department.code}",
                first_name=department.name.split()[0],
                last_name="Nodal Officer",
                is_staff=True,
                is_verified=True,
                created_by=admin,
            )

            if department.head_officer_id != officer.id:
                department.head_officer = officer
                department.save(update_fields=["head_officer"])
                self.stdout.write(self.style.SUCCESS(f"  Mapped {department.name} to {username}"))

        citizen = self.upsert_user(
            "citizen_demo",
            citizen_password,
            email="citizen@jansamadhan.in",
            phone="9876543210",
            role="CITIZEN",
            first_name="Rahul",
            last_name="Kumar",
            is_verified=True,
        )

        if os.environ.get("JAN_SAMADHAN_SEED_SAMPLE_COMPLAINTS", "True") == "True":
            self.seed_complaints(citizen)

        self.stdout.write(self.style.SUCCESS("Seed complete!"))

    def seed_complaints(self, citizen):
        samples = [
            {
                "title": "Transformer outage in Ward 12",
                "description": "No electricity in Ward 12 since last night. Transformer is making sparks and residents are worried.",
                "location": "Ward 12, Lucknow",
                "category": "ELECTRICITY",
            },
            {
                "title": "Water pipeline leakage near school",
                "description": "Drinking water pipeline is leaking near the primary school and supply pressure is very low.",
                "location": "Chinhat, Lucknow",
                "category": "WATER",
            },
            {
                "title": "Garbage collection pending for one week",
                "description": "Garbage has not been collected from the market lane for one week and there is bad smell.",
                "location": "Main Market, Lucknow",
                "category": "SANITATION",
            },
            {
                "title": "Dangerous potholes on service road",
                "description": "Large potholes on the service road are causing traffic and accidents during evening hours.",
                "location": "Ring Road, Lucknow",
                "category": "ROADS",
            },
        ]

        for sample in samples:
            complaint, created = Complaint.objects.get_or_create(
                citizen=citizen,
                title=sample["title"],
                defaults={
                    "description": sample["description"],
                    "location": sample["location"],
                    "category": sample["category"],
                    "ai_category": sample["category"],
                    "ai_confidence": 0.84,
                    "priority": "HIGH",
                    "original_language": "en",
                    "translated_description": sample["description"],
                    "sla_deadline": timezone.now() + timezone.timedelta(hours=24),
                },
            )
            if not created:
                self.stdout.write(f"  Exists sample grievance: {complaint.ticket_id} / {complaint.title}")
                continue

            routing_data = {}
            apply_initial_grievance_routing(routing_data, sample["category"])
            for field, value in routing_data.items():
                setattr(complaint, field, value)
            complaint.save()

            if complaint.assigned_officer:
                ForwardingRecord.objects.create(
                    complaint=complaint,
                    from_user=None,
                    to_user=complaint.assigned_officer,
                    from_level="SYSTEM",
                    to_level="DEPARTMENT",
                    action="ASSIGN",
                    note="Demo grievance auto-routed to department nodal officer.",
                )
                ComplaintHistory.objects.create(
                    complaint=complaint,
                    changed_by=None,
                    old_status="PENDING",
                    new_status=complaint.status,
                    note="Demo grievance auto-routed to department nodal officer.",
                )
                Notification.objects.create(
                    recipient=complaint.assigned_officer,
                    complaint=complaint,
                    notification_type="ASSIGNED",
                    title=f"Demo Grievance Assigned: #{complaint.ticket_id}",
                    message=f"{complaint.title} has been routed to your department.",
                )

            Notification.objects.create(
                recipient=citizen,
                complaint=complaint,
                notification_type="ASSIGNED",
                title=f"Demo Grievance Created: #{complaint.ticket_id}",
                message="This sample grievance is available for testing tracking and feedback.",
            )
            self.stdout.write(self.style.SUCCESS(f"  Created sample grievance: {complaint.ticket_id} / {complaint.title}"))
