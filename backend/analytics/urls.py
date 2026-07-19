from django.urls import path
from .views import (
    ProfileSkillDetailView,
)

app_name = "analytics"

urlpatterns = [
    path(
        "profile/<slug:category_slug>/<slug:skill_slug>/rank/",
        ProfileSkillDetailView.as_view(),
        name="profile-skill-detail",
    ),
]
