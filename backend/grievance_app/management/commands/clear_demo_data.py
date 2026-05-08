from django.core.management.base import BaseCommand

from grievance_app.models import Complaint, ComplaintHistory, Department, ForwardingRecord, Notification, User


DEMO_USERNAMES = [
    "pm_officer", "cm_officer", "district_officer", "block_officer", "field_officer",
    "citizen_demo", "chief_public_grievance", "state_grievance_director", "lucknow_division_head",
    "citizen_rahul", "citizen_aisha",
    "electricity_head", "electricity_sub_head", "electricity_urban_head", "electricity_urban_sub",
    "electricity_haz_head", "electricity_haz_sub", "electricity_rural_head", "electricity_rural_sub",
    "water_head", "water_sub_head", "water_urban_head", "water_urban_sub",
    "water_chinhat_head", "water_chinhat_sub", "water_maint_head", "water_maint_sub",
    "sanitation_head", "sanitation_sub_head", "sanitation_market_head", "sanitation_market_sub",
    "sanitation_waste_head", "sanitation_waste_sub",
    "roads_head", "roads_sub_head", "roads_ring_head", "roads_ring_sub",
    "roads_repair_head", "roads_repair_sub",
    "services_head", "services_sub_head", "services_cert_head", "services_cert_sub",
    "services_help_head", "services_help_sub",
    "health_head", "health_sub_head", "health_clinic_head", "health_clinic_sub",
    "health_outreach_head", "health_outreach_sub",
    "education_head", "education_sub_head", "education_school_head", "education_school_sub",
    "education_scholar_head", "education_scholar_sub",
    "general_head", "general_sub_head", "general_case_head", "general_case_sub",
    "general_appeal_head", "general_appeal_sub",
]

DEMO_DEPARTMENT_CODES = [
    "ELECTRICITY", "WATER", "SANITATION", "ROADS", "PUBLIC_SERVICES", "HEALTH", "EDUCATION", "OTHER",
    "EL_URBAN", "EL_HAZRAT", "EL_RURAL",
    "WT_URBAN", "WT_CHNHAT", "WT_MAINT",
    "SN_MARKET", "SN_WASTE",
    "RD_RING", "RD_REPAIR",
    "PS_CERT", "PS_HELP",
    "HL_CLINIC", "HL_OUTRCH",
    "ED_SCHOOL", "ED_SCHLR",
    "OT_CASE", "OT_APPEAL",
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
