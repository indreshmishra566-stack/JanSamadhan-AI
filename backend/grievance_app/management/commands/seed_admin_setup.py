from django.conf import settings
from django.core.management.base import BaseCommand

from grievance_app.models import Department, User


DEPARTMENT_SETUP = [
    ("Water Supply", "WATER", "Handles water supply, leakage, pressure, and connection grievances.", "officer_water", "Water Supply Officer", "Lucknow"),
    ("Electricity", "ELECTRICITY", "Handles power outage, transformer, meter, and wiring grievances.", "officer_electricity", "Electricity Officer", "Lucknow"),
    ("Sanitation", "SANITATION", "Handles sewerage, public toilet, cleaning, and hygiene grievances.", "officer_sanitation", "Sanitation Officer", "Lucknow"),
    ("Roads", "ROADS", "Handles potholes, damaged roads, footpath, and road maintenance grievances.", "officer_roads", "Roads Officer", "Lucknow"),
    ("Health Services", "HEALTH", "Handles public health, hospital, medicine, and emergency service grievances.", "officer_health", "Health Services Officer", "Lucknow"),
    ("Education", "EDUCATION", "Handles school, scholarship, teacher, and education service grievances.", "officer_education", "Education Officer", "Lucknow"),
    ("Public Services", "PUBLIC_SERVICES", "Handles certificates, public offices, and general citizen service grievances.", "officer_public_services", "Public Services Officer", "Lucknow"),
    ("Drainage", "DRAINAGE", "Handles blocked drains, waterlogging, and storm-water drainage grievances.", "officer_drainage", "Drainage Officer", "Lucknow"),
    ("Street Lighting", "STREET_LIGHT", "Handles street light repair, dark spots, and pole maintenance grievances.", "officer_street_light", "Street Lighting Officer", "Lucknow"),
    ("Waste Management", "WASTE_MGMT", "Handles garbage collection, dumping, and solid waste grievances.", "officer_waste_mgmt", "Waste Management Officer", "Lucknow"),
]


class Command(BaseCommand):
    help = "Create 10 admin-owned departments and one officer for each department."

    def handle(self, *args, **kwargs):
        admin = User.objects.filter(role="ADMIN", is_active=True).order_by("id").first()
        if not admin:
            admin_password = getattr(settings, "DEFAULT_ADMIN_PASSWORD", "12345678")
            admin = User.objects.create_user(
                username="admin",
                email="admin@jansamadhan.in",
                password=admin_password,
                role="ADMIN",
                first_name="System",
                last_name="Admin",
                is_active=True,
                is_verified=True,
            )
            self.stdout.write(self.style.WARNING("No active admin found, so a default admin was created."))

        password = "Officer@1234"
        created_departments = []
        created_officers = []

        for index, (name, code, description, username, designation, district) in enumerate(DEPARTMENT_SETUP, start=1):
            department, department_created = Department.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "email": f"{code.lower()}@jansamadhan.in",
                    "created_by": admin,
                    "is_active": True,
                },
            )

            officer_defaults = {
                "email": f"{username}@jansamadhan.in",
                "role": "OFFICER",
                "first_name": designation.replace(" Officer", ""),
                "last_name": "Officer",
                "designation": designation,
                "department": department,
                "employee_id": f"JS-OFF-{index:03d}",
                "phone": "",
                "state": "Uttar Pradesh",
                "district": district,
                "block": "",
                "created_by": admin,
                "reports_to": admin,
                "is_active": True,
                "is_verified": True,
            }
            officer, officer_created = User.objects.update_or_create(
                username=username,
                defaults=officer_defaults,
            )
            officer.set_password(password)
            officer.save(update_fields=["password"])

            department.head_officer = officer
            department.save(update_fields=["head_officer"])

            created_departments.append({"name": department.name, "code": department.code, "created": department_created})
            created_officers.append({"username": officer.username, "department": department.name, "created": officer_created})

        self.stdout.write(self.style.SUCCESS("Admin setup is ready."))
        self.stdout.write(f"Admin: {admin.username}")
        self.stdout.write(f"Officer password: {password}")
        for item in created_officers:
            state = "created" if item["created"] else "updated"
            self.stdout.write(f"  {item['username']} -> {item['department']} ({state})")
