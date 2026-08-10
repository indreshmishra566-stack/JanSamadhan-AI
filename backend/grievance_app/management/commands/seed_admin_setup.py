from django.conf import settings
from django.core.management.base import BaseCommand

from grievance_app.models import Department, User


DEPARTMENT_SETUP = [
    ("Water Supply", "WATER", "Handles water supply, leakage, pressure, and connection grievances."),
    ("Electricity", "ELECTRICITY", "Handles power outage, transformer, meter, and wiring grievances."),
    ("Sanitation", "SANITATION", "Handles sewerage, public toilet, cleaning, garbage, and hygiene grievances."),
    ("Roads & Infrastructure", "ROADS", "Handles potholes, damaged roads, footpaths, drainage on roads, and road maintenance grievances."),
    ("Health Services", "HEALTH", "Handles public health, hospital, medicine, ambulance, and emergency service grievances."),
    ("Education", "EDUCATION", "Handles school, scholarship, teacher, classroom, and education service grievances."),
    ("Public Services", "PUBLIC_SERVICES", "Handles certificates, public offices, welfare delivery, and citizen service grievances."),
    ("Other / General Grievances", "OTHER", "Handles grievances that do not match a specific department category."),
]


class Command(BaseCommand):
    help = "Create the 8 core admin-owned departments used for grievance routing."

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

        created_departments = []

        for name, code, description in DEPARTMENT_SETUP:
            department, department_created = Department.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "email": "",
                    "created_by": admin,
                    "is_active": True,
                },
            )

            created_departments.append({"name": department.name, "code": department.code, "created": department_created})

        self.stdout.write(self.style.SUCCESS("Core department setup is ready."))
        self.stdout.write(f"Admin: {admin.username}")
        self.stdout.write("No officers were created. Add officer emails from the dashboard to assign heads.")
        for item in created_departments:
            state = "created" if item["created"] else "updated"
            self.stdout.write(f"  {item['code']} -> {item['name']} ({state})")
