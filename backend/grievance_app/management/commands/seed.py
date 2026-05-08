import os

from django.core.management.base import BaseCommand
from django.utils import timezone

from grievance_app.models import Complaint, ComplaintHistory, Department, ForwardingRecord, Notification, User
from grievance_app.routing import apply_initial_grievance_routing


WATER_USERS = [
    "chief_public_grievance",
    "central_water_mission_head",
    "central_water_ops",
    "up_water_director",
    "up_water_deputy",
    "lucknow_division_head",
    "lucknow_division_ops",
    "lucknow_district_water_head",
    "lucknow_district_water_sub",
    "bkt_block_water_head",
    "bkt_block_water_sub",
    "itaunja_panchayat_head",
    "itaunja_panchayat_sub",
    "nabinagar_village_operator",
    "nabinagar_village_support",
    "malihabad_block_water_head",
    "malihabad_block_water_sub",
    "rahimabad_panchayat_head",
    "rahimabad_panchayat_sub",
    "hasanapur_village_operator",
    "hasanapur_village_support",
    "citizen_rahul",
    "citizen_aisha",
    "citizen_neha",
]

WATER_DEPARTMENTS = [
    "WATER",
    "WT_CENTRAL_OPS",
    "WT_UP",
    "WT_LKO_DIV",
    "WT_LKO_DIST",
    "WT_BKT",
    "WT_ITAUNJA_GP",
    "WT_NABINAGAR",
    "WT_MALIHABAD",
    "WT_RAHIMABAD_GP",
    "WT_HASANAPUR",
]


class Command(BaseCommand):
    help = "Seed a full water department hierarchy from central India branch to local village operations."

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

    def create_branch(self, *, code, name, email, description, parent, created_by, head_data, sub_data):
        department = self.upsert_department(
            code,
            name=name,
            email=email,
            description=description,
            parent=parent,
            created_by=created_by,
            is_active=True,
        )

        head = self.upsert_user(**head_data, department=department)
        sub_defaults = dict(sub_data)
        sub_defaults.setdefault("created_by", head)
        sub_defaults.setdefault("reports_to", head)
        if sub_defaults.get("created_by") == "__HEAD__":
            sub_defaults["created_by"] = head
        if sub_defaults.get("reports_to") == "__HEAD__":
            sub_defaults["reports_to"] = head
        sub_head = self.upsert_user(**sub_defaults, department=department)

        department.head_officer = head
        department.sub_head_officer = sub_head
        department.created_by = created_by
        department.save(update_fields=["head_officer", "sub_head_officer", "created_by"])

        self.stdout.write(
            self.style.SUCCESS(f"  Mapped {department.name} leadership to {head.username} / {sub_head.username}")
        )
        return department, head, sub_head

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

        chief_public_grievance = self.upsert_user(
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
            state="India",
        )

        water_department, central_head, central_sub = self.create_branch(
            code="WATER",
            name="National Water Supply Department",
            email="water@jansamadhan.in",
            description="National level water grievance command desk for policy and supervisory routing.",
            parent=None,
            created_by=admin,
            head_data={
                "username": "central_water_mission_head",
                "password": officer_password,
                "email": "central.water.head@jansamadhan.in",
                "role": "OFFICER",
                "designation": "National Water Mission Head",
                "employee_id": "WATER-CENTRAL-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Meera",
                "last_name": "Iyer",
                "state": "India",
                "district": "National",
                "block": "Central Desk",
                "created_by": admin,
                "reports_to": chief_public_grievance,
            },
            sub_data={
                "username": "central_water_ops",
                "password": officer_password,
                "email": "central.water.ops@jansamadhan.in",
                "role": "OFFICER",
                "designation": "National Water Operations Deputy",
                "employee_id": "WATER-CENTRAL-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Rohit",
                "last_name": "Menon",
                "state": "India",
                "district": "National",
                "block": "Central Desk",
                "created_by": "__HEAD__",
                "reports_to": "__HEAD__",
            },
        )

        up_state_dept, up_head, up_sub = self.create_branch(
            code="WT_UP",
            name="Uttar Pradesh Water Directorate",
            email="up.water@jansamadhan.in",
            description="State command branch for Uttar Pradesh water complaints.",
            parent=water_department,
            created_by=central_head,
            head_data={
                "username": "up_water_director",
                "password": officer_password,
                "email": "up.water.director@jansamadhan.in",
                "role": "OFFICER",
                "designation": "State Water Director",
                "employee_id": "WT-UP-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Nisha",
                "last_name": "Verma",
                "state": "Uttar Pradesh",
                "district": "State HQ",
                "block": "Lucknow Secretariat",
                "created_by": central_head,
                "reports_to": central_sub,
            },
            sub_data={
                "username": "up_water_deputy",
                "password": officer_password,
                "email": "up.water.deputy@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Deputy State Water Director",
                "employee_id": "WT-UP-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Ankit",
                "last_name": "Bajaj",
                "state": "Uttar Pradesh",
                "district": "State HQ",
                "block": "Lucknow Secretariat",
                "created_by": up_head,
                "reports_to": up_head,
            },
        )

        lucknow_division, division_head, division_sub = self.create_branch(
            code="WT_LKO_DIV",
            name="Lucknow Water Division",
            email="lucknow.division.water@jansamadhan.in",
            description="Division-level water branch overseeing Lucknow region.",
            parent=up_state_dept,
            created_by=up_head,
            head_data={
                "username": "lucknow_division_head",
                "password": officer_password,
                "email": "lucknow.division.head@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Lucknow Division Water Head",
                "employee_id": "WT-LKO-DIV-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Raghav",
                "last_name": "Singh",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Division Desk",
                "created_by": up_head,
                "reports_to": up_sub,
            },
            sub_data={
                "username": "lucknow_division_ops",
                "password": officer_password,
                "email": "lucknow.division.ops@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Lucknow Division Operations Officer",
                "employee_id": "WT-LKO-DIV-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Sonal",
                "last_name": "Tripathi",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Division Desk",
                "created_by": division_head,
                "reports_to": division_head,
            },
        )

        district_dept, district_head, district_sub = self.create_branch(
            code="WT_LKO_DIST",
            name="Lucknow District Water Department",
            email="lucknow.district.water@jansamadhan.in",
            description="District command branch for Lucknow city and nearby blocks.",
            parent=lucknow_division,
            created_by=division_head,
            head_data={
                "username": "lucknow_district_water_head",
                "password": officer_password,
                "email": "lucknow.district.head@jansamadhan.in",
                "role": "OFFICER",
                "designation": "District Water Head",
                "employee_id": "WT-LKO-DIST-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Vivek",
                "last_name": "Pandey",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "District Desk",
                "created_by": division_head,
                "reports_to": division_sub,
            },
            sub_data={
                "username": "lucknow_district_water_sub",
                "password": officer_password,
                "email": "lucknow.district.sub@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Deputy District Water Head",
                "employee_id": "WT-LKO-DIST-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Kiran",
                "last_name": "Awasthi",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "District Desk",
                "created_by": district_head,
                "reports_to": district_head,
            },
        )

        bkt_dept, bkt_head, bkt_sub = self.create_branch(
            code="WT_BKT",
            name="Bakshi Ka Talab Block Water Office",
            email="bkt.water@jansamadhan.in",
            description="Block water office for Bakshi Ka Talab.",
            parent=district_dept,
            created_by=district_head,
            head_data={
                "username": "bkt_block_water_head",
                "password": officer_password,
                "email": "bkt.block.head@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Block Water Head - BKT",
                "employee_id": "WT-BKT-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Priya",
                "last_name": "Saxena",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "created_by": district_head,
                "reports_to": district_sub,
            },
            sub_data={
                "username": "bkt_block_water_sub",
                "password": officer_password,
                "email": "bkt.block.sub@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Assistant Block Water Head - BKT",
                "employee_id": "WT-BKT-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Amit",
                "last_name": "Rawat",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "created_by": bkt_head,
                "reports_to": bkt_head,
            },
        )

        itaunja_gp, itaunja_head, itaunja_sub = self.create_branch(
            code="WT_ITAUNJA_GP",
            name="Itaunja Gram Panchayat Water Cell",
            email="itaunja.gp.water@jansamadhan.in",
            description="Gram panchayat water grievance cell for Itaunja.",
            parent=bkt_dept,
            created_by=bkt_head,
            head_data={
                "username": "itaunja_panchayat_head",
                "password": officer_password,
                "email": "itaunja.gp.head@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Gram Panchayat Water Head - Itaunja",
                "employee_id": "WT-ITAUNJA-GP-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Deepa",
                "last_name": "Mishra",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "created_by": bkt_head,
                "reports_to": bkt_sub,
            },
            sub_data={
                "username": "itaunja_panchayat_sub",
                "password": officer_password,
                "email": "itaunja.gp.sub@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Gram Panchayat Water Supervisor - Itaunja",
                "employee_id": "WT-ITAUNJA-GP-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Manoj",
                "last_name": "Yadav",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "created_by": itaunja_head,
                "reports_to": itaunja_head,
            },
        )

        nabinagar_dept, nabinagar_head, nabinagar_sub = self.create_branch(
            code="WT_NABINAGAR",
            name="Nabinagar Village Water Unit",
            email="nabinagar.water@jansamadhan.in",
            description="Village-level water operations for Nabinagar.",
            parent=itaunja_gp,
            created_by=itaunja_head,
            head_data={
                "username": "nabinagar_village_operator",
                "password": officer_password,
                "email": "nabinagar.operator@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Village Water Operator - Nabinagar",
                "employee_id": "WT-NABINAGAR-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Suresh",
                "last_name": "Pal",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "created_by": itaunja_head,
                "reports_to": itaunja_sub,
            },
            sub_data={
                "username": "nabinagar_village_support",
                "password": officer_password,
                "email": "nabinagar.support@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Village Water Technician - Nabinagar",
                "employee_id": "WT-NABINAGAR-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Poonam",
                "last_name": "Raj",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "created_by": nabinagar_head,
                "reports_to": nabinagar_head,
            },
        )

        malihabad_dept, malihabad_head, malihabad_sub = self.create_branch(
            code="WT_MALIHABAD",
            name="Malihabad Block Water Office",
            email="malihabad.water@jansamadhan.in",
            description="Block water office for Malihabad.",
            parent=district_dept,
            created_by=district_head,
            head_data={
                "username": "malihabad_block_water_head",
                "password": officer_password,
                "email": "malihabad.block.head@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Block Water Head - Malihabad",
                "employee_id": "WT-MALIHABAD-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Farhan",
                "last_name": "Khan",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "created_by": district_head,
                "reports_to": district_sub,
            },
            sub_data={
                "username": "malihabad_block_water_sub",
                "password": officer_password,
                "email": "malihabad.block.sub@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Assistant Block Water Head - Malihabad",
                "employee_id": "WT-MALIHABAD-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Lata",
                "last_name": "Jain",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "created_by": malihabad_head,
                "reports_to": malihabad_head,
            },
        )

        rahimabad_gp, rahimabad_head, rahimabad_sub = self.create_branch(
            code="WT_RAHIMABAD_GP",
            name="Rahimabad Gram Panchayat Water Cell",
            email="rahimabad.gp.water@jansamadhan.in",
            description="Gram panchayat water branch for Rahimabad.",
            parent=malihabad_dept,
            created_by=malihabad_head,
            head_data={
                "username": "rahimabad_panchayat_head",
                "password": officer_password,
                "email": "rahimabad.gp.head@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Gram Panchayat Water Head - Rahimabad",
                "employee_id": "WT-RAHIMABAD-GP-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Geeta",
                "last_name": "Maurya",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "created_by": malihabad_head,
                "reports_to": malihabad_sub,
            },
            sub_data={
                "username": "rahimabad_panchayat_sub",
                "password": officer_password,
                "email": "rahimabad.gp.sub@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Gram Panchayat Water Supervisor - Rahimabad",
                "employee_id": "WT-RAHIMABAD-GP-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Vinod",
                "last_name": "Kushwaha",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "created_by": rahimabad_head,
                "reports_to": rahimabad_head,
            },
        )

        hasanapur_dept, hasanapur_head, hasanapur_sub = self.create_branch(
            code="WT_HASANAPUR",
            name="Hasanapur Village Water Unit",
            email="hasanapur.water@jansamadhan.in",
            description="Village-level water operations for Hasanapur.",
            parent=rahimabad_gp,
            created_by=rahimabad_head,
            head_data={
                "username": "hasanapur_village_operator",
                "password": officer_password,
                "email": "hasanapur.operator@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Village Water Operator - Hasanapur",
                "employee_id": "WT-HASANAPUR-HEAD",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Kamlesh",
                "last_name": "Verma",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "created_by": rahimabad_head,
                "reports_to": rahimabad_sub,
            },
            sub_data={
                "username": "hasanapur_village_support",
                "password": officer_password,
                "email": "hasanapur.support@jansamadhan.in",
                "role": "OFFICER",
                "designation": "Village Water Technician - Hasanapur",
                "employee_id": "WT-HASANAPUR-SUB",
                "is_active": True,
                "is_staff": True,
                "is_verified": True,
                "first_name": "Rekha",
                "last_name": "Pal",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "created_by": hasanapur_head,
                "reports_to": hasanapur_head,
            },
        )

        citizen_rahul = self.upsert_user(
            "citizen_rahul",
            citizen_password,
            email="rahul.kumar@jansamadhan.in",
            phone="9876543210",
            role="CITIZEN",
            first_name="Rahul",
            last_name="Kumar",
            is_active=True,
            is_verified=True,
            state="Uttar Pradesh",
            district="Lucknow",
            block="Bakshi Ka Talab",
        )
        citizen_aisha = self.upsert_user(
            "citizen_aisha",
            citizen_password,
            email="aisha.fatima@jansamadhan.in",
            phone="9876501234",
            role="CITIZEN",
            first_name="Aisha",
            last_name="Fatima",
            is_active=True,
            is_verified=True,
            state="Uttar Pradesh",
            district="Lucknow",
            block="Malihabad",
        )
        citizen_neha = self.upsert_user(
            "citizen_neha",
            citizen_password,
            email="neha.singh@jansamadhan.in",
            phone="9812345678",
            role="CITIZEN",
            first_name="Neha",
            last_name="Singh",
            is_active=True,
            is_verified=True,
            state="Uttar Pradesh",
            district="Lucknow",
            block="Bakshi Ka Talab",
        )

        if os.environ.get("JAN_SAMADHAN_SEED_SAMPLE_COMPLAINTS", "True") == "True":
            self.seed_complaints(citizen_rahul, citizen_aisha, citizen_neha)

        self.stdout.write(self.style.SUCCESS("Seed complete!"))

    def reset_demo_data(self):
        stale_officer_aliases = list(User.objects.filter(username__startswith="nodal_").values_list("username", flat=True))
        usernames_to_clear = WATER_USERS + stale_officer_aliases

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
            Department.objects.filter(created_by_id__in=demo_ids).update(created_by=None)
            demo_users.delete()
            self.stdout.write(self.style.SUCCESS("  Cleared old water demo members and sample grievances"))

        Department.objects.filter(code__in=WATER_DEPARTMENTS).delete()

    def seed_complaints(self, citizen_rahul, citizen_aisha, citizen_neha):
        samples = [
            {
                "title": "Drinking water pipeline leakage in Nabinagar village",
                "description": "The main drinking water line is leaking near the primary school in Nabinagar village and pressure is dropping fast.",
                "location": "Nabinagar Village, Itaunja, Bakshi Ka Talab, Lucknow",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "category": "WATER",
                "citizen": citizen_rahul,
            },
            {
                "title": "No tap water supply in Hasanapur village",
                "description": "Households in Hasanapur village have not received drinking water since yesterday morning and storage tanks are empty.",
                "location": "Hasanapur Village, Rahimabad, Malihabad, Lucknow",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "category": "WATER",
                "citizen": citizen_aisha,
            },
            {
                "title": "Contaminated water from handpump near Itaunja market",
                "description": "Residents are reporting muddy and foul smelling water from the handpump near Itaunja market. Urgent testing is needed.",
                "location": "Itaunja Market, Bakshi Ka Talab, Lucknow",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "category": "WATER",
                "citizen": citizen_neha,
            },
            {
                "title": "Tanker support needed after village borewell failure",
                "description": "The village borewell motor has failed and immediate tanker support is required until repair is complete.",
                "location": "Rahimabad Gram Panchayat, Malihabad, Lucknow",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Malihabad",
                "category": "WATER",
                "citizen": citizen_aisha,
            },
            {
                "title": "Repeated low water pressure across Bakshi Ka Talab belt",
                "description": "Several settlements across Bakshi Ka Talab are facing repeated low pressure supply during morning hours.",
                "location": "Bakshi Ka Talab, Lucknow",
                "state": "Uttar Pradesh",
                "district": "Lucknow",
                "block": "Bakshi Ka Talab",
                "category": "WATER",
                "citizen": citizen_rahul,
            },
        ]

        for sample in samples:
            complaint, created = Complaint.objects.get_or_create(
                citizen=sample["citizen"],
                title=sample["title"],
                defaults={
                    "description": sample["description"],
                    "location": sample["location"],
                    "state": sample["state"],
                    "district": sample["district"],
                    "block": sample["block"],
                    "category": sample["category"],
                    "ai_category": sample["category"],
                    "ai_confidence": 0.88,
                    "priority": "HIGH",
                    "original_language": "en",
                    "translated_description": sample["description"],
                    "sla_deadline": timezone.now() + timezone.timedelta(hours=24),
                },
            )
            if not created:
                self.stdout.write(f"  Exists sample grievance: {complaint.ticket_id} / {complaint.title}")
                continue

            routing_data = {
                "state": sample["state"],
                "district": sample["district"],
                "block": sample["block"],
                "location": sample["location"],
            }
            apply_initial_grievance_routing(routing_data, sample["category"], citizen=sample["citizen"])
            for field, value in routing_data.items():
                setattr(complaint, field, value)
            complaint.save()

            if complaint.assigned_officer:
                ForwardingRecord.objects.create(
                    complaint=complaint,
                    from_user=None,
                    to_user=complaint.assigned_officer,
                    from_level="SYSTEM",
                    to_level=complaint.current_level,
                    action="ASSIGN",
                    note="Demo grievance auto-routed to the nearest water branch officer.",
                )
                ComplaintHistory.objects.create(
                    complaint=complaint,
                    changed_by=None,
                    old_status="PENDING",
                    new_status=complaint.status,
                    note="Demo grievance auto-routed to the nearest water branch officer.",
                )
                Notification.objects.create(
                    recipient=complaint.assigned_officer,
                    complaint=complaint,
                    notification_type="ASSIGNED",
                    title=f"Demo Grievance Assigned: #{complaint.ticket_id}",
                    message=f"{complaint.title} has been routed to your water branch.",
                )

            Notification.objects.create(
                recipient=sample["citizen"],
                complaint=complaint,
                notification_type="ASSIGNED",
                title=f"Demo Grievance Created: #{complaint.ticket_id}",
                message="This sample grievance is available for testing routing, escalation, and tracking.",
            )
            self.stdout.write(self.style.SUCCESS(f"  Created sample grievance: {complaint.ticket_id} / {complaint.title}"))
