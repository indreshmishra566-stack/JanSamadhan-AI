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

        self.reset_demo_data()

        admin = self.upsert_user(
            "admin",
            admin_password,
            email="admin@jansamadhan.in",
            role="ADMIN",
            is_active=True,
            is_staff=True,
            is_superuser=True,
            is_verified=True,
            first_name="System",
            last_name="Administrator",
            designation="Platform Administrator",
        )

        pm_user = self.upsert_user(
            "chief_public_grievance",
            officer_password,
            email="chief.public.grievance@jansamadhan.in",
            role="PM",
            is_active=True,
            is_staff=True,
            is_verified=True,
            first_name="Aarav",
            last_name="Sharma",
            designation="Chief Public Grievance Officer",
            created_by=admin,
            reports_to=admin,
        )
        cm_user = self.upsert_user(
            "state_grievance_director",
            officer_password,
            email="state.director@jansamadhan.in",
            role="CM",
            is_active=True,
            is_staff=True,
            is_verified=True,
            state="Uttar Pradesh",
            first_name="Nisha",
            last_name="Verma",
            designation="State Grievance Director",
            created_by=pm_user,
            reports_to=pm_user,
        )

        hierarchy_root = self.upsert_user(
            "lucknow_division_head",
            officer_password,
            email="lucknow.division@jansamadhan.in",
            role="DISTRICT_OFFICER",
            is_active=True,
            is_staff=True,
            is_verified=True,
            state="Uttar Pradesh",
            district="Lucknow",
            first_name="Raghav",
            last_name="Singh",
            designation="Lucknow Division Grievance Head",
            created_by=cm_user,
            reports_to=cm_user,
        )

        department_blueprints = [
            {
                "code": "ELECTRICITY",
                "head": ("electricity_head", "Priya", "Mehta", "Chief Engineer", "DISTRICT_OFFICER"),
                "sub_head": ("electricity_sub_head", "Kunal", "Yadav", "Operations Manager", "BLOCK_OFFICER"),
                "team": [
                    ("electricity_zone_north", "Ritu", "Saxena", "Zone Officer North", "FIELD_OFFICER"),
                    ("electricity_field_alpha", "Deepak", "Rana", "Field Supervisor Alpha", "OFFICER"),
                ],
            },
            {
                "code": "WATER",
                "head": ("water_head", "Sana", "Ali", "Water Supply Director", "DISTRICT_OFFICER"),
                "sub_head": ("water_sub_head", "Vivek", "Pandey", "Pipeline Control Lead", "BLOCK_OFFICER"),
                "team": [
                    ("water_zone_east", "Mohit", "Kapoor", "Zone Officer East", "FIELD_OFFICER"),
                    ("water_field_delta", "Akash", "Tiwari", "Maintenance Inspector", "OFFICER"),
                ],
            },
            {
                "code": "SANITATION",
                "head": ("sanitation_head", "Neha", "Joshi", "Sanitation Head", "DISTRICT_OFFICER"),
                "sub_head": ("sanitation_sub_head", "Faizan", "Khan", "Ward Cleanup Lead", "BLOCK_OFFICER"),
                "team": [
                    ("sanitation_zone_market", "Pooja", "Rawat", "Market Zone Officer", "FIELD_OFFICER"),
                    ("sanitation_field_one", "Harsh", "Gupta", "Inspection Officer", "OFFICER"),
                ],
            },
            {
                "code": "ROADS",
                "head": ("roads_head", "Anjali", "Srivastava", "Road Asset Head", "DISTRICT_OFFICER"),
                "sub_head": ("roads_sub_head", "Rohit", "Sengar", "Project Sub Head", "BLOCK_OFFICER"),
                "team": [
                    ("roads_zone_ring", "Kirti", "Awasthi", "Ring Road Officer", "FIELD_OFFICER"),
                    ("roads_field_patch", "Nitin", "Pal", "Repair Supervisor", "OFFICER"),
                ],
            },
            {
                "code": "PUBLIC_SERVICES",
                "head": ("services_head", "Madhav", "Tripathi", "Citizen Services Head", "DISTRICT_OFFICER"),
                "sub_head": ("services_sub_head", "Isha", "Bajaj", "Service Desk Sub Head", "BLOCK_OFFICER"),
                "team": [
                    ("services_zone_docs", "Tanya", "Mishra", "Documentation Officer", "FIELD_OFFICER"),
                    ("services_field_counter", "Varun", "Das", "Counter Operations Officer", "OFFICER"),
                ],
            },
            {
                "code": "HEALTH",
                "head": ("health_head", "Aditi", "Sethi", "Public Health Head", "DISTRICT_OFFICER"),
                "sub_head": ("health_sub_head", "Sameer", "Nanda", "Facility Sub Head", "BLOCK_OFFICER"),
                "team": [
                    ("health_zone_clinic", "Juhi", "Arora", "Clinic Monitoring Officer", "FIELD_OFFICER"),
                    ("health_field_support", "Manoj", "Bisht", "Medical Support Officer", "OFFICER"),
                ],
            },
            {
                "code": "EDUCATION",
                "head": ("education_head", "Swati", "Kulshreshtha", "Education Head", "DISTRICT_OFFICER"),
                "sub_head": ("education_sub_head", "Arpit", "Nigam", "School Support Sub Head", "BLOCK_OFFICER"),
                "team": [
                    ("education_zone_school", "Meenal", "Puri", "School Quality Officer", "FIELD_OFFICER"),
                    ("education_field_audit", "Tarun", "Bora", "Field Audit Officer", "OFFICER"),
                ],
            },
            {
                "code": "OTHER",
                "head": ("general_head", "Reema", "Sood", "General Grievance Head", "DISTRICT_OFFICER"),
                "sub_head": ("general_sub_head", "Dev", "Madan", "General Desk Sub Head", "BLOCK_OFFICER"),
                "team": [
                    ("general_zone_casework", "Nupur", "Chauhan", "Casework Officer", "FIELD_OFFICER"),
                    ("general_field_support", "Yash", "Suri", "Support Officer", "OFFICER"),
                ],
            },
        ]

        for blueprint in department_blueprints:
            department = Department.objects.get(code=blueprint["code"])
            head_username, head_first, head_last, head_designation, head_role = blueprint["head"]
            sub_username, sub_first, sub_last, sub_designation, sub_role = blueprint["sub_head"]

            head = self.upsert_user(
                head_username,
                officer_password,
                email=f"{head_username}@jansamadhan.in",
                role=head_role,
                designation=head_designation,
                department=department,
                employee_id=f"{department.code}-HEAD",
                is_active=True,
                is_staff=True,
                is_verified=True,
                first_name=head_first,
                last_name=head_last,
                state="Uttar Pradesh",
                district="Lucknow",
                created_by=admin,
                reports_to=hierarchy_root,
            )
            sub_head = self.upsert_user(
                sub_username,
                officer_password,
                email=f"{sub_username}@jansamadhan.in",
                role=sub_role,
                designation=sub_designation,
                department=department,
                employee_id=f"{department.code}-SUB",
                is_active=True,
                is_staff=True,
                is_verified=True,
                first_name=sub_first,
                last_name=sub_last,
                state="Uttar Pradesh",
                district="Lucknow",
                block="Central",
                created_by=head,
                reports_to=head,
            )

            department.head_officer = head
            department.sub_head_officer = sub_head
            department.save(update_fields=["head_officer", "sub_head_officer"])
            self.stdout.write(self.style.SUCCESS(f"  Mapped {department.name} leadership to {head_username} / {sub_username}"))

            manager = sub_head
            for index, (username, first_name, last_name, designation, role) in enumerate(blueprint["team"], start=1):
                manager = self.upsert_user(
                    username,
                    officer_password,
                    email=f"{username}@jansamadhan.in",
                    role=role,
                    designation=designation,
                    department=department,
                    employee_id=f"{department.code}-TEAM-{index}",
                    is_active=True,
                    is_staff=True,
                    is_verified=True,
                    first_name=first_name,
                    last_name=last_name,
                    state="Uttar Pradesh",
                    district="Lucknow",
                    block="Central",
                    created_by=manager,
                    reports_to=manager,
                )

        citizen = self.upsert_user(
            "citizen_rahul",
            citizen_password,
            email="rahul.kumar@jansamadhan.in",
            phone="9876543210",
            role="CITIZEN",
            first_name="Rahul",
            last_name="Kumar",
            is_active=True,
            is_verified=True,
        )
        citizen_two = self.upsert_user(
            "citizen_aisha",
            citizen_password,
            email="aisha.fatima@jansamadhan.in",
            phone="9876501234",
            role="CITIZEN",
            first_name="Aisha",
            last_name="Fatima",
            is_active=True,
            is_verified=True,
        )

        if os.environ.get("JAN_SAMADHAN_SEED_SAMPLE_COMPLAINTS", "True") == "True":
            self.seed_complaints(citizen, citizen_two)

        self.stdout.write(self.style.SUCCESS("Seed complete!"))

    def reset_demo_data(self):
        demo_usernames = [
            "pm_officer", "cm_officer", "district_officer", "block_officer", "field_officer",
            "citizen_demo", "chief_public_grievance", "state_grievance_director", "lucknow_division_head",
            "citizen_rahul", "citizen_aisha",
            "electricity_head", "electricity_sub_head", "electricity_zone_north", "electricity_field_alpha",
            "water_head", "water_sub_head", "water_zone_east", "water_field_delta",
            "sanitation_head", "sanitation_sub_head", "sanitation_zone_market", "sanitation_field_one",
            "roads_head", "roads_sub_head", "roads_zone_ring", "roads_field_patch",
            "services_head", "services_sub_head", "services_zone_docs", "services_field_counter",
            "health_head", "health_sub_head", "health_zone_clinic", "health_field_support",
            "education_head", "education_sub_head", "education_zone_school", "education_field_audit",
            "general_head", "general_sub_head", "general_zone_casework", "general_field_support",
        ]
        stale_nodal = list(User.objects.filter(username__startswith="nodal_").values_list("username", flat=True))
        usernames_to_clear = demo_usernames + stale_nodal

        demo_users = User.objects.filter(username__in=usernames_to_clear)
        demo_ids = list(demo_users.values_list("id", flat=True))

        if demo_ids:
            Notification.objects.filter(recipient_id__in=demo_ids).delete()
            ComplaintHistory.objects.filter(changed_by_id__in=demo_ids).delete()
            ForwardingRecord.objects.filter(from_user_id__in=demo_ids).delete()
            ForwardingRecord.objects.filter(to_user_id__in=demo_ids).delete()
            Complaint.objects.filter(citizen_id__in=demo_ids).delete()
            Department.objects.filter(head_officer_id__in=demo_ids).update(head_officer=None)
            Department.objects.filter(sub_head_officer_id__in=demo_ids).update(sub_head_officer=None)
            demo_users.delete()
            self.stdout.write(self.style.SUCCESS("  Cleared old demo members and sample grievances"))

    def seed_complaints(self, citizen_one, citizen_two):
        samples = [
            {
                "title": "Transformer outage in Ward 12",
                "description": "No electricity in Ward 12 since last night. Transformer is making sparks and residents are worried.",
                "location": "Ward 12, Lucknow",
                "category": "ELECTRICITY",
                "citizen": citizen_one,
            },
            {
                "title": "Water pipeline leakage near school",
                "description": "Drinking water pipeline is leaking near the primary school and supply pressure is very low.",
                "location": "Chinhat, Lucknow",
                "category": "WATER",
                "citizen": citizen_two,
            },
            {
                "title": "Garbage collection pending for one week",
                "description": "Garbage has not been collected from the market lane for one week and there is bad smell.",
                "location": "Main Market, Lucknow",
                "category": "SANITATION",
                "citizen": citizen_one,
            },
            {
                "title": "Dangerous potholes on service road",
                "description": "Large potholes on the service road are causing traffic and accidents during evening hours.",
                "location": "Ring Road, Lucknow",
                "category": "ROADS",
                "citizen": citizen_two,
            },
            {
                "title": "Birth certificate counter delay",
                "description": "Citizen service counter has delayed certificate delivery for more than ten days and staff are not responding.",
                "location": "Tehsil Service Center, Lucknow",
                "category": "PUBLIC_SERVICES",
                "citizen": citizen_one,
            },
        ]

        for sample in samples:
            complaint, created = Complaint.objects.get_or_create(
                citizen=sample["citizen"],
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
                recipient=sample["citizen"],
                complaint=complaint,
                notification_type="ASSIGNED",
                title=f"Demo Grievance Created: #{complaint.ticket_id}",
                message="This sample grievance is available for testing tracking and feedback.",
            )
            self.stdout.write(self.style.SUCCESS(f"  Created sample grievance: {complaint.ticket_id} / {complaint.title}"))
