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
                "slug": "electricity",
                "code": "ELECTRICITY",
                "name": "Electricity Department",
                "email": "electricity@jansamadhan.in",
                "head": ("electricity_head", "Priya", "Mehta", "Department Head - Electricity", "OFFICER"),
                "sub_head": ("electricity_sub_head", "Kunal", "Yadav", "Deputy Department Head - Electricity", "OFFICER"),
                "children": [
                    {
                        "code": "EL_URBAN",
                        "name": "Electricity Urban Circle",
                        "email": "electricity.urban@jansamadhan.in",
                        "head": ("electricity_urban_head", "Ritu", "Saxena", "Urban Circle Head", "OFFICER"),
                        "sub_head": ("electricity_urban_sub", "Deepak", "Rana", "Urban Circle Sub Head", "OFFICER"),
                        "grandchildren": [
                            {
                                "code": "EL_HAZRAT",
                                "name": "Hazratganj Electricity Division",
                                "email": "electricity.hazratganj@jansamadhan.in",
                                "head": ("electricity_haz_head", "Anamika", "Sethi", "Division Head - Hazratganj", "OFFICER"),
                                "sub_head": ("electricity_haz_sub", "Lokesh", "Tandon", "Division Sub Head - Hazratganj", "OFFICER"),
                            },
                        ],
                    },
                    {
                        "code": "EL_RURAL",
                        "name": "Electricity Rural Circle",
                        "email": "electricity.rural@jansamadhan.in",
                        "head": ("electricity_rural_head", "Harsh", "Awasthi", "Rural Circle Head", "OFFICER"),
                        "sub_head": ("electricity_rural_sub", "Mona", "Yusuf", "Rural Circle Sub Head", "OFFICER"),
                    },
                ],
            },
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
            {
                "slug": "sanitation",
                "code": "SANITATION",
                "name": "Sanitation Department",
                "email": "sanitation@jansamadhan.in",
                "head": ("sanitation_head", "Neha", "Joshi", "Department Head - Sanitation", "OFFICER"),
                "sub_head": ("sanitation_sub_head", "Faizan", "Khan", "Deputy Department Head - Sanitation", "OFFICER"),
                "children": [
                    {
                        "code": "SN_MARKET",
                        "name": "Market Sanitation Circle",
                        "email": "sanitation.market@jansamadhan.in",
                        "head": ("sanitation_market_head", "Pooja", "Rawat", "Market Circle Head", "OFFICER"),
                        "sub_head": ("sanitation_market_sub", "Harsh", "Gupta", "Market Circle Sub Head", "OFFICER"),
                    },
                    {
                        "code": "SN_WASTE",
                        "name": "Waste Transport Wing",
                        "email": "sanitation.transport@jansamadhan.in",
                        "head": ("sanitation_waste_head", "Lalit", "Soni", "Waste Wing Head", "OFFICER"),
                        "sub_head": ("sanitation_waste_sub", "Shreya", "Rao", "Waste Wing Sub Head", "OFFICER"),
                    },
                ],
            },
            {
                "slug": "roads",
                "code": "ROADS",
                "name": "Roads & Infrastructure",
                "email": "roads@jansamadhan.in",
                "head": ("roads_head", "Anjali", "Srivastava", "Department Head - Roads", "OFFICER"),
                "sub_head": ("roads_sub_head", "Rohit", "Sengar", "Deputy Department Head - Roads", "OFFICER"),
                "children": [
                    {
                        "code": "RD_RING",
                        "name": "Ring Road Circle",
                        "email": "roads.ring@jansamadhan.in",
                        "head": ("roads_ring_head", "Kirti", "Awasthi", "Ring Road Circle Head", "OFFICER"),
                        "sub_head": ("roads_ring_sub", "Nitin", "Pal", "Ring Road Circle Sub Head", "OFFICER"),
                    },
                    {
                        "code": "RD_REPAIR",
                        "name": "Rapid Repair Wing",
                        "email": "roads.repair@jansamadhan.in",
                        "head": ("roads_repair_head", "Ira", "Bhatia", "Rapid Repair Head", "OFFICER"),
                        "sub_head": ("roads_repair_sub", "Gaurav", "Pundir", "Rapid Repair Sub Head", "OFFICER"),
                    },
                ],
            },
            {
                "slug": "services",
                "code": "PUBLIC_SERVICES",
                "name": "Public Services",
                "email": "public@jansamadhan.in",
                "head": ("services_head", "Madhav", "Tripathi", "Department Head - Public Services", "OFFICER"),
                "sub_head": ("services_sub_head", "Isha", "Bajaj", "Deputy Department Head - Public Services", "OFFICER"),
                "children": [
                    {
                        "code": "PS_CERT",
                        "name": "Certificates & Records Wing",
                        "email": "public.certificates@jansamadhan.in",
                        "head": ("services_cert_head", "Tanya", "Mishra", "Records Wing Head", "OFFICER"),
                        "sub_head": ("services_cert_sub", "Varun", "Das", "Records Wing Sub Head", "OFFICER"),
                    },
                    {
                        "code": "PS_HELP",
                        "name": "Citizen Helpdesk Wing",
                        "email": "public.helpdesk@jansamadhan.in",
                        "head": ("services_help_head", "Aman", "Sharma", "Helpdesk Wing Head", "OFFICER"),
                        "sub_head": ("services_help_sub", "Nidhi", "Sen", "Helpdesk Wing Sub Head", "OFFICER"),
                    },
                ],
            },
            {
                "slug": "health",
                "code": "HEALTH",
                "name": "Health Department",
                "email": "health@jansamadhan.in",
                "head": ("health_head", "Aditi", "Sethi", "Department Head - Health", "OFFICER"),
                "sub_head": ("health_sub_head", "Sameer", "Nanda", "Deputy Department Head - Health", "OFFICER"),
                "children": [
                    {
                        "code": "HL_CLINIC",
                        "name": "Clinic Monitoring Wing",
                        "email": "health.clinic@jansamadhan.in",
                        "head": ("health_clinic_head", "Juhi", "Arora", "Clinic Wing Head", "OFFICER"),
                        "sub_head": ("health_clinic_sub", "Manoj", "Bisht", "Clinic Wing Sub Head", "OFFICER"),
                    },
                    {
                        "code": "HL_OUTRCH",
                        "name": "Public Outreach Wing",
                        "email": "health.outreach@jansamadhan.in",
                        "head": ("health_outreach_head", "Kavya", "Mathur", "Outreach Wing Head", "OFFICER"),
                        "sub_head": ("health_outreach_sub", "Dheeraj", "Paul", "Outreach Wing Sub Head", "OFFICER"),
                    },
                ],
            },
            {
                "slug": "education",
                "code": "EDUCATION",
                "name": "Education Department",
                "email": "education@jansamadhan.in",
                "head": ("education_head", "Swati", "Kulshreshtha", "Department Head - Education", "OFFICER"),
                "sub_head": ("education_sub_head", "Arpit", "Nigam", "Deputy Department Head - Education", "OFFICER"),
                "children": [
                    {
                        "code": "ED_SCHOOL",
                        "name": "School Quality Wing",
                        "email": "education.school@jansamadhan.in",
                        "head": ("education_school_head", "Meenal", "Puri", "School Quality Head", "OFFICER"),
                        "sub_head": ("education_school_sub", "Tarun", "Bora", "School Quality Sub Head", "OFFICER"),
                    },
                    {
                        "code": "ED_SCHLR",
                        "name": "Scholarship Support Wing",
                        "email": "education.scholarship@jansamadhan.in",
                        "head": ("education_scholar_head", "Komal", "Jain", "Scholarship Wing Head", "OFFICER"),
                        "sub_head": ("education_scholar_sub", "Ritik", "Chandra", "Scholarship Wing Sub Head", "OFFICER"),
                    },
                ],
            },
            {
                "slug": "general",
                "code": "OTHER",
                "name": "General / Other",
                "email": "general@jansamadhan.in",
                "head": ("general_head", "Reema", "Sood", "Department Head - General Grievances", "OFFICER"),
                "sub_head": ("general_sub_head", "Dev", "Madan", "Deputy Department Head - General Grievances", "OFFICER"),
                "children": [
                    {
                        "code": "OT_CASE",
                        "name": "Casework Coordination Wing",
                        "email": "general.casework@jansamadhan.in",
                        "head": ("general_case_head", "Nupur", "Chauhan", "Casework Wing Head", "OFFICER"),
                        "sub_head": ("general_case_sub", "Yash", "Suri", "Casework Wing Sub Head", "OFFICER"),
                    },
                    {
                        "code": "OT_APPEAL",
                        "name": "Appeals & Review Wing",
                        "email": "general.appeals@jansamadhan.in",
                        "head": ("general_appeal_head", "Rashi", "Vora", "Appeals Wing Head", "OFFICER"),
                        "sub_head": ("general_appeal_sub", "Hemant", "Nair", "Appeals Wing Sub Head", "OFFICER"),
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
            "electricity_head", "electricity_sub_head", "electricity_urban_head", "electricity_urban_sub",
            "electricity_haz_head", "electricity_haz_sub", "electricity_rural_head", "electricity_rural_sub",
            "water_head", "water_sub_head", "water_urban_head", "water_urban_sub",
            "water_chinhat_head", "water_chinhat_sub", "water_maint_head", "water_maint_sub",
            "sanitation_head", "sanitation_sub_head", "sanitation_market_head", "sanitation_market_sub",
            "sanitation_waste_head", "sanitation_waste_sub",
            "roads_head", "roads_sub_head", "roads_ring_head", "roads_ring_sub",
            "roads_repair_head", "roads_repair_sub",
            "services_head", "services_sub_head", "services_cert_head", "services_cert_sub",
            "services_help_head", "services_help_sub",
            "health_head", "health_sub_head", "health_clinic_head", "health_clinic_sub",
            "health_outreach_head", "health_outreach_sub",
            "education_head", "education_sub_head", "education_school_head", "education_school_sub",
            "education_scholar_head", "education_scholar_sub",
            "general_head", "general_sub_head", "general_case_head", "general_case_sub",
            "general_appeal_head", "general_appeal_sub",
        ]
        demo_department_codes = [
            "EL_URBAN", "EL_HAZRAT", "EL_RURAL",
            "WT_URBAN", "WT_CHNHAT", "WT_MAINT",
            "SN_MARKET", "SN_WASTE",
            "RD_RING", "RD_REPAIR",
            "PS_CERT", "PS_HELP",
            "HL_CLINIC", "HL_OUTRCH",
            "ED_SCHOOL", "ED_SCHLR",
            "OT_CASE", "OT_APPEAL",
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
