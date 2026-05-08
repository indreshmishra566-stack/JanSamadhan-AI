from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/me/", views.MeView.as_view()),

    # Departments
    path("departments/", views.DepartmentListView.as_view()),
    path("departments/<int:pk>/", views.DepartmentDetailView.as_view()),

    # Citizen
    path("complaints/", views.CitizenComplaintListCreateView.as_view()),
    path("complaints/<int:pk>/", views.CitizenComplaintDetailView.as_view()),
    path("complaints/<int:pk>/feedback/", views.CitizenFeedbackView.as_view()),

    # Hierarchy actions (forward / escalate)
    path("complaints/<int:pk>/forward/", views.forward_complaint),
    path("complaints/<int:pk>/escalate/", views.escalate_complaint),

    # Hierarchy officer views
    path("hierarchy/complaints/", views.HierarchyComplaintListView.as_view()),
    path("hierarchy/complaints/<int:pk>/", views.HierarchyComplaintUpdateView.as_view()),
    path("hierarchy/create-officer/", views.create_subordinate_officer),
    path("hierarchy/subordinates/", views.my_subordinates),
    path("hierarchy/officers/<int:pk>/", views.HierarchyOfficerDetailView.as_view()),

    # Admin
    path("admin/complaints/", views.AdminComplaintListView.as_view()),
    path("admin/complaints/<int:pk>/", views.AdminComplaintUpdateView.as_view()),
    path("admin/stats/", views.AdminDashboardStatsView.as_view()),
    path("admin/users/", views.AdminUserListView.as_view()),
    path("admin/users/<int:pk>/", views.AdminUserDetailView.as_view()),
    path("admin/create-officer/", views.AdminCreateOfficerView.as_view()),

    # Officer (legacy)
    path("officer/complaints/", views.OfficerComplaintListView.as_view()),
    path("officer/complaints/<int:pk>/", views.OfficerComplaintUpdateView.as_view()),

    # Notifications
    path("notifications/", views.NotificationListView.as_view()),
    path("notifications/<int:pk>/read/", views.mark_notification_read),

    # Public tracking
    path("track/<str:ticket_id>/", views.track_complaint),
    path("demo/seed/", views.run_demo_seed),
    path("demo/clear/", views.run_demo_clear),
]
