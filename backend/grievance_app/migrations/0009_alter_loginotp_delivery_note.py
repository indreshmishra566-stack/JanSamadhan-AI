from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0008_user_citizen_registration_details"),
    ]

    operations = [
        migrations.AlterField(
            model_name="loginotp",
            name="delivery_note",
            field=models.TextField(blank=True),
        ),
    ]
