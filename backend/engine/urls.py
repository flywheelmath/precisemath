from django.urls import path
from . import views
from .views import (
    PlayerView,
    PlayerSkillLevelView,
    SessionPromptsView,
    SessionResultsView,
)

app_name = "engine"

urlpatterns = [
    path(
        "player/",
        PlayerView.as_view(),
        name="player_identity"
    ),
    path(
        "player/level/<slug:category_slug>/<slug:skill_slug>/",
        PlayerSkillLevelView.as_view(),
        name="player_skill_level",
    ),
    path(
        "sessions/prompts/<slug:category_slug>/<slug:skill_slug>/",
        SessionPromptsView.as_view(),
        name="session_prompts",
    ),
    path(
        "sessions/",
        SessionResultsView.as_view(),
        name="session_results"
    ),
]
