from django.core.management.base import BaseCommand
from grievance_app.models import Department, User


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
