from django.db import migrations


CORE_DEPARTMENTS = [
    ("Water Supply", "WATER", "Handles water supply, leakage, pressure, and connection grievances."),
    ("Electricity", "ELECTRICITY", "Handles power outage, transformer, meter, and wiring grievances."),
    ("Sanitation", "SANITATION", "Handles sewerage, public toilet, cleaning, garbage, and hygiene grievances."),
    ("Roads & Infrastructure", "ROADS", "Handles potholes, damaged roads, footpaths, drainage on roads, and road maintenance grievances."),
    ("Health Services", "HEALTH", "Handles public health, hospital, medicine, ambulance, and emergency service grievances."),
    ("Education", "EDUCATION", "Handles school, scholarship, teacher, classroom, and education service grievances."),
    ("Public Services", "PUBLIC_SERVICES", "Handles certificates, public offices, welfare delivery, and citizen service grievances."),
    ("Other / General Grievances", "OTHER", "Handles grievances that do not match a specific department category."),
]


def seed_core_departments(apps, schema_editor):
    Department = apps.get_model("grievance_app", "Department")
    User = apps.get_model("grievance_app", "User")

    admin = User.objects.filter(role="ADMIN", is_active=True).order_by("id").first()
    for name, code, description in CORE_DEPARTMENTS:
        Department.objects.update_or_create(
            code=code,
            defaults={
                "name": name,
                "description": description,
                "email": "",
                "created_by": admin,
                "is_active": True,
            },
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0009_alter_loginotp_delivery_note"),
    ]

    operations = [
        migrations.RunPython(seed_core_departments, noop_reverse),
    ]
