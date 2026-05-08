from django.core.management.base import BaseCommand

from grievance_app.models import Complaint, ComplaintHistory, Department, ForwardingRecord, Notification, User


DEMO_USERNAMES = [
    "pm_officer", "cm_officer", "district_officer", "block_officer", "field_officer",
    "citizen_demo", "chief_public_grievance", "state_grievance_director", "lucknow_division_head",
    "citizen_rahul", "citizen_aisha",
    "water_head", "water_sub_head", "water_urban_head", "water_urban_sub",
    "water_chinhat_head", "water_chinhat_sub", "water_maint_head", "water_maint_sub",
]

DEMO_DEPARTMENT_CODES = [
    "WATER",
    "WT_URBAN", "WT_CHNHAT", "WT_MAINT",
]


class Command(BaseCommand):
    help = "Delete seeded demo hierarchy data while keeping admin and non-demo data."

    def handle(self, *args, **kwargs):
        stale_officer_aliases = list(User.objects.filter(username__startswith="nodal_").values_list("username", flat=True))
        usernames_to_clear = DEMO_USERNAMES + stale_officer_aliases

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
            self.stdout.write(self.style.SUCCESS("Deleted demo users, complaints, and related records."))
        else:
            self.stdout.write("No demo users found.")

        deleted_count, _ = Department.objects.filter(code__in=DEMO_DEPARTMENT_CODES).delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} demo department records."))
        self.stdout.write(self.style.SUCCESS("Demo cleanup complete. Admin user was kept unchanged."))
