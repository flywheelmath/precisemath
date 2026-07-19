from django.urls import path
from .views import (
    PlayerSkillLevelView,
    SessionPromptsView,
    SessionResultsView,
)

app_name = "engine"

urlpatterns = [
    path(
        "<slug:category_slug>/<slug:skill_slug>/level/",
        PlayerSkillLevelView.as_view(),
        name="player_skill_level",
    ),
    path(
        "<slug:category_slug>/<slug:skill_slug>/prompts/",
        SessionPromptsView.as_view(),
        name="session_prompts",
    ),
    path(
        "",
        SessionResultsView.as_view(),
        name="session_results"
    ),
]
