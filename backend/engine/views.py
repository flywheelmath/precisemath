from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models_prompt import (
    Prompt,
    Skill,
    SkillLevel,
)
from .models_session import Player, PlayerSkillProfile
from .serializers import (
    PromptSerializer,
    SessionCreateSerializer,
    SkillLevelDataSerializer,
)


@method_decorator(never_cache, name="get")
class PlayerSkillLevelView(APIView):
    """
    Returns the current level for the player.
    """
    permission_classes = [AllowAny]

    def get(self, request, category_slug=None, skill_slug=None):
        try:
            skill = Skill.objects.get(category__slug=category_slug, slug=skill_slug)
        except Skill.DoesNotExist:
            return Response({"error": "Skill not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        guest_token = request.query_params.get("guest_token")

        if not user.is_authenticated and not guest_token:
            return Response(
                {"error": "Authentication or guest token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        player = Player.objects.resolve_player(user, guest_token)
        player.check_cache_window()
        player_skill_level = PlayerSkillProfile.objects.get_profile_rank(player, skill)
        return Response({"player_skill_level": player_skill_level})


class SessionPromptsView(APIView):
    """
    API endpoint to start a new session.
    Fetches a batch of prompts from a given skill.
    This view is cached for performance.
    """

    permission_classes = [AllowAny]

    def get(self, request, category_slug=None, skill_slug=None, format=None):
        try:
            skill = Skill.objects.get(category__slug=category_slug, slug=skill_slug)
        except Skill.DoesNotExist:
            return Response(
                {"error": "Skill not found."}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            player_skill_level = int(request.query_params.get("player_skill_level", 99))
        except (ValueError, TypeError):
            player_skill_level = 99

        # temporarily disregard skill level
        #player_skill_level = 99

        cache_key = f"prompts_{skill.id}-{player_skill_level}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        prompts_queryset = Prompt.objects.select_related("skill_level").filter(
            skill_level__skill=skill,
            skill_level__skill_level_rank__lte=player_skill_level+5,
            is_active=True,
        )

        prompt_data = PromptSerializer(prompts_queryset, many=True).data

        skill_levels_queryset = SkillLevel.objects.filter(
            skill=skill, skill_level_rank__lte=player_skill_level+5
        ).order_by('skill_level_rank')
        skill_level_data = SkillLevelDataSerializer(skill_levels_queryset, many=True).data

        response_payload = {
            "skill_levels": skill_level_data,
            "prompts": prompt_data,
        }

        cache.set(cache_key, response_payload, timeout=1000)
        return Response(response_payload, status=status.HTTP_200_OK)


class SessionResultsView(APIView):
    """
    API endpoint to receive and save the results of a completed session.
    Allows any user, registered or not, to submit results.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SessionCreateSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            session_instance = serializer.save()
            from .models_session import PlayerSkillProfile
            new_level = PlayerSkillProfile.objects.get_profile_rank(
                session_instance.player,
                session_instance.skill
            )

            response_data = serializer.to_representation(session_instance)
            response_data["new_level"] = new_level
            return Response(response_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
