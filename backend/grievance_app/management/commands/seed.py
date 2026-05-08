from django.core.management.base import BaseCommand
from django.utils import timezone

from grievance_app.models import Complaint, ComplaintHistory, Department, ForwardingRecord, Notification, User
from grievance_app.routing import apply_initial_grievance_routing
import os


class Command(BaseCommand):
    help = "Seed departments, demo users, reporting branches, and sample grievances"

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

    def upsert_department(self, code, **defaults):
        department, created = Department.objects.get_or_create(code=code, defaults=defaults)
        for field, value in defaults.items():
            if getattr(department, field) != value:
                setattr(department, field, value)
        department.save()
        label = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"  {label} dept: {department.name}"))
        return department

    def handle(self, *args, **kwargs):
        admin_password = os.environ.get("JAN_SAMADHAN_SEED_ADMIN_PASSWORD", "Admin@1234")
        officer_password = os.environ.get("JAN_SAMADHAN_SEED_OFFICER_PASSWORD", "Officer@1234")
        citizen_password = os.environ.get("JAN_SAMADHAN_SEED_CITIZEN_PASSWORD", "Citizen@1234")

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
            role="OFFICER",
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
            role="OFFICER",
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
            role="OFFICER",
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
                "slug": "water",
                "code": "WATER",
                "name": "Water Supply Department",
                "email": "water@jansamadhan.in",
                "head": ("water_head", "Sana", "Ali", "Department Head - Water Supply", "OFFICER"),
                "sub_head": ("water_sub_head", "Vivek", "Pandey", "Deputy Department Head - Water Supply", "OFFICER"),
                "children": [
                    {
                        "code": "WT_URBAN",
                        "name": "Urban Water Operations",
                        "email": "water.urban@jansamadhan.in",
                        "head": ("water_urban_head", "Mohit", "Kapoor", "Urban Operations Head", "OFFICER"),
                        "sub_head": ("water_urban_sub", "Akash", "Tiwari", "Urban Operations Sub Head", "OFFICER"),
                        "grandchildren": [
                            {
                                "code": "WT_CHNHAT",
                                "name": "Chinhat Water Division",
                                "email": "water.chinhat@jansamadhan.in",
                                "head": ("water_chinhat_head", "Sakshi", "Gupta", "Division Head - Chinhat", "OFFICER"),
                                "sub_head": ("water_chinhat_sub", "Ramesh", "Shukla", "Division Sub Head - Chinhat", "OFFICER"),
                            },
                        ],
                    },
                    {
                        "code": "WT_MAINT",
                        "name": "Pipeline Maintenance Wing",
                        "email": "water.maintenance@jansamadhan.in",
                        "head": ("water_maint_head", "Prabhat", "Nigam", "Maintenance Wing Head", "OFFICER"),
                        "sub_head": ("water_maint_sub", "Pallavi", "Bora", "Maintenance Wing Sub Head", "OFFICER"),
                    },
                ],
            },
        ]

        for blueprint in department_blueprints:
            department = self.upsert_department(
                blueprint["code"],
                name=blueprint["name"],
                email=blueprint["email"],
                description=f"Root department for {blueprint['name']} grievances.",
                parent=None,
                created_by=admin,
                is_active=True,
            )
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
            department.created_by = admin
            department.save(update_fields=["head_officer", "sub_head_officer", "created_by"])
            self.stdout.write(self.style.SUCCESS(f"  Mapped {department.name} leadership to {head_username} / {sub_username}"))

            for child in blueprint["children"]:
                child_department = self.upsert_department(
                    child["code"],
                    name=child["name"],
                    email=child["email"],
                    description=f"Child department under {department.name}.",
                    parent=department,
                    created_by=head,
                    is_active=True,
                )
                child_head_username, child_head_first, child_head_last, child_head_designation, child_head_role = child["head"]
                child_sub_username, child_sub_first, child_sub_last, child_sub_designation, child_sub_role = child["sub_head"]

                child_head = self.upsert_user(
                    child_head_username,
                    officer_password,
                    email=f"{child_head_username}@jansamadhan.in",
                    role=child_head_role,
                    designation=child_head_designation,
                    department=child_department,
                    employee_id=f"{child_department.code}-HEAD",
                    is_active=True,
                    is_staff=True,
                    is_verified=True,
                    first_name=child_head_first,
                    last_name=child_head_last,
                    state="Uttar Pradesh",
                    district="Lucknow",
                    block="Central",
                    created_by=head,
                    reports_to=sub_head,
                )
                child_sub_head = self.upsert_user(
                    child_sub_username,
                    officer_password,
                    email=f"{child_sub_username}@jansamadhan.in",
                    role=child_sub_role,
                    designation=child_sub_designation,
                    department=child_department,
                    employee_id=f"{child_department.code}-SUB",
                    is_active=True,
                    is_staff=True,
                    is_verified=True,
                    first_name=child_sub_first,
                    last_name=child_sub_last,
                    state="Uttar Pradesh",
                    district="Lucknow",
                    block="Central",
                    created_by=child_head,
                    reports_to=child_head,
                )
                child_department.head_officer = child_head
                child_department.sub_head_officer = child_sub_head
                child_department.save(update_fields=["head_officer", "sub_head_officer"])

                for grandchild in child.get("grandchildren", []):
                    grandchild_department = self.upsert_department(
                        grandchild["code"],
                        name=grandchild["name"],
                        email=grandchild["email"],
                        description=f"Nested child department under {child_department.name}.",
                        parent=child_department,
                        created_by=child_head,
                        is_active=True,
                    )
                    grand_head_username, grand_head_first, grand_head_last, grand_head_designation, grand_head_role = grandchild["head"]
                    grand_sub_username, grand_sub_first, grand_sub_last, grand_sub_designation, grand_sub_role = grandchild["sub_head"]

                    grand_head = self.upsert_user(
                        grand_head_username,
                        officer_password,
                        email=f"{grand_head_username}@jansamadhan.in",
                        role=grand_head_role,
                        designation=grand_head_designation,
                        department=grandchild_department,
                        employee_id=f"{grandchild_department.code}-HEAD",
                        is_active=True,
                        is_staff=True,
                        is_verified=True,
                        first_name=grand_head_first,
                        last_name=grand_head_last,
                        state="Uttar Pradesh",
                        district="Lucknow",
                        block="Central",
                        created_by=child_head,
                        reports_to=child_sub_head,
                    )
                    grand_sub_head = self.upsert_user(
                        grand_sub_username,
                        officer_password,
                        email=f"{grand_sub_username}@jansamadhan.in",
                        role=grand_sub_role,
                        designation=grand_sub_designation,
                        department=grandchild_department,
                        employee_id=f"{grandchild_department.code}-SUB",
                        is_active=True,
                        is_staff=True,
                        is_verified=True,
                        first_name=grand_sub_first,
                        last_name=grand_sub_last,
                        state="Uttar Pradesh",
                        district="Lucknow",
                        block="Central",
                        created_by=grand_head,
                        reports_to=grand_head,
                    )
                    grandchild_department.head_officer = grand_head
                    grandchild_department.sub_head_officer = grand_sub_head
                    grandchild_department.save(update_fields=["head_officer", "sub_head_officer"])

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
            "water_head", "water_sub_head", "water_urban_head", "water_urban_sub",
            "water_chinhat_head", "water_chinhat_sub", "water_maint_head", "water_maint_sub",
        ]
        demo_department_codes = [
            "WATER",
            "WT_URBAN", "WT_CHNHAT", "WT_MAINT",
        ]
        stale_officer_aliases = list(User.objects.filter(username__startswith="nodal_").values_list("username", flat=True))
        usernames_to_clear = demo_usernames + stale_officer_aliases

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

        Department.objects.filter(code__in=demo_department_codes).delete()

    def seed_complaints(self, citizen_one, citizen_two):
        samples = [
            {
                "title": "Water pipeline leakage near school",
                "description": "Drinking water pipeline is leaking near the primary school and supply pressure is very low.",
                "location": "Chinhat, Lucknow",
                "category": "WATER",
                "citizen": citizen_one,
            },
            {
                "title": "No morning water supply in Sector B",
                "description": "Residents in Sector B did not receive morning water supply for two consecutive days and need urgent restoration.",
                "location": "Sector B, Lucknow",
                "category": "WATER",
                "citizen": citizen_two,
            },
            {
                "title": "Contaminated tap water complaint",
                "description": "Tap water has become muddy and unsafe in the residential block. A maintenance team inspection is required.",
                "location": "Indira Nagar, Lucknow",
                "category": "WATER",
                "citizen": citizen_one,
            },
            {
                "title": "Low water pressure in upper floors",
                "description": "Upper floors in the apartment block are receiving very low water pressure, especially in the evening.",
                "location": "Aliganj, Lucknow",
                "category": "WATER",
                "citizen": citizen_two,
            },
            {
                "title": "Water tanker request for emergency outage",
                "description": "A local pumping station outage has left the area without water. Residents need tanker support until supply resumes.",
                "location": "Gomti Nagar Extension, Lucknow",
                "category": "WATER",
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
                    note="Demo grievance auto-routed to department owner.",
                )
                ComplaintHistory.objects.create(
                    complaint=complaint,
                    changed_by=None,
                    old_status="PENDING",
                    new_status=complaint.status,
                    note="Demo grievance auto-routed to department owner.",
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
