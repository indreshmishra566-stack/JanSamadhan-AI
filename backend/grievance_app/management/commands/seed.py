from django.core.management.base import BaseCommand
from grievance_app.models import Department, User
import os


class Command(BaseCommand):
    help = "Seed initial departments and create superadmin"

    def handle(self, *args, **kwargs):
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

        officer_password = os.environ.get("JAN_SAMADHAN_SEED_OFFICER_PASSWORD", "Officer@1234")
        for department in Department.objects.filter(is_active=True):
            username = f"nodal_{department.code.lower()}"
            officer, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": department.email or f"{username}@jansamadhan.in",
                    "role": "OFFICER",
                    "department": department,
                    "employee_id": f"NODAL-{department.code}",
                    "first_name": department.name.split()[0],
                    "last_name": "Nodal Officer",
                    "is_verified": True,
                },
            )
            if created:
                officer.set_password(officer_password)
                officer.save()
                self.stdout.write(self.style.SUCCESS(f"  Created nodal officer: {username}"))
            else:
                updates = []
                if officer.department_id != department.id:
                    officer.department = department
                    updates.append("department")
                if not officer.is_verified:
                    officer.is_verified = True
                    updates.append("is_verified")
                if officer.role == "CITIZEN":
                    officer.role = "OFFICER"
                    updates.append("role")
                if updates:
                    officer.save(update_fields=updates)
                self.stdout.write(f"  Exists nodal officer: {username}")

            if department.head_officer_id != officer.id:
                department.head_officer = officer
                department.save(update_fields=["head_officer"])
                self.stdout.write(self.style.SUCCESS(f"  Mapped {department.name} to {username}"))

        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                email="admin@jansamadhan.in",
                password="Admin@1234",
                role="ADMIN",
            )
            self.stdout.write(self.style.SUCCESS("  Superadmin created: admin / Admin@1234"))
        else:
            self.stdout.write("  Superadmin already exists.")

        self.stdout.write(self.style.SUCCESS("Seed complete!"))
