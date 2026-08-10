from django.core.management.base import BaseCommand

from grievance_app.models import Complaint, ComplaintHistory, Department, ForwardingRecord, Notification, User


DEMO_USERNAMES = [
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

DEMO_DEPARTMENT_CODES = [
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
