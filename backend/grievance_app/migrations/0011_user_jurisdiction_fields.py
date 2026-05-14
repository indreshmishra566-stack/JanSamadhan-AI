from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0010_seed_core_departments"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="jurisdiction_level",
            field=models.CharField(
                blank=True,
                choices=[
                    ("CENTRAL", "Central"),
                    ("STATE", "State"),
                    ("DISTRICT", "District"),
                    ("BLOCK", "Block"),
                    ("VILLAGE", "Village / Ward"),
                ],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="village",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
