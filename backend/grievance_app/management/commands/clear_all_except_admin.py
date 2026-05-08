from django.core.management.base import BaseCommand

from grievance_app.models import Complaint, ComplaintHistory, Department, ForwardingRecord, Notification, User


class Command(BaseCommand):
    help = "Delete all non-admin data while preserving admin account(s)."

    def handle(self, *args, **kwargs):
        admin_ids = list(User.objects.filter(role="ADMIN").values_list("id", flat=True))

        if not admin_ids:
            self.stdout.write(self.style.ERROR("No admin user found. Cleanup aborted."))
            return

        Notification.objects.all().delete()
        ComplaintHistory.objects.all().delete()
        ForwardingRecord.objects.all().delete()
        Complaint.objects.all().delete()
        Department.objects.all().delete()

        deleted_users, _ = User.objects.exclude(id__in=admin_ids).delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_users} non-admin user records."))

        User.objects.filter(id__in=admin_ids).update(
            department=None,
            created_by=None,
            reports_to=None,
        )

        admins = list(
            User.objects.filter(id__in=admin_ids).values("username", "email", "first_name", "last_name")
        )
        self.stdout.write(self.style.SUCCESS("All non-admin data was removed. Admin account(s) were preserved."))
        for admin in admins:
            self.stdout.write(f"  Kept admin: {admin['username']}")
