import uuid
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    SessionPayloadSerializer,
    SkillLevelDataSerializer,
)
from .utils.pseudonyms import generate_pseudonym


@api_view(["GET"])
@permission_classes([AllowAny])
def get_or_create_player(request):
    user_id = request.headers.get("X-User-Identifier")
    guest_id = request.headers.get("X-Guest-Identifier")

    if not user_id and not guest_id:
        return Response({"error": "User ID or Guest ID required."}, status=status.HTTP_400_BAD_REQUEST)

    if user_id:
        player, created = Player.objects.get_or_create(
            domain_identifier=user_id,
            defaults={
                "is_guest": False,
                "pseudonym": generate_pseudonym(user_id)
            }
        )

    else:
        player = Player.objects.filter(domain_identifier=guest_id, is_guest=True).first()
        if not player:
            return Response({"error": "Guest player profile expired or not found."}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "id": str(player.domain_identifier),
        "is_guest": player.is_guest,
        "display_name": player.pseudonym,
        "pin": str(player.domain_identifier)[-4:].upper()
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def create_guest_player(request):
    """
    Creates an orphaned player object for guest sessions.
    Returns UUID token to be passed in the X-Guest-Token header.
    """
    guest_uuid = uuid.uuid4()

    player = Player.objects.create(
        domain_identifier=guest_uuid,
        is_guest=True,
        pseudonym=generate_pseudonym(guest_uuid),
    )

    return Response({
        "status": "success",
        "guest_token": str(player.domain_identifier),
        "id": str(player.domain_identifier),
        "display_name": player.pseudonym,
        "is_guest": True,
        "pin": str(player.domain_identifier)[-4:].upper(),
    }, status=status.HTTP_201_CREATED)


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
        serializer = SessionPayloadSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            session_instance = serializer.save()

            if serializer.validated_data.get("is_final", False):
                compute_player_skill_level(player=session_instance.player, skill=session_instance.skill)

            new_level = PlayerSkillProfile.objects.get_profile_rank(
                session_instance.player,
                session_instance.skill
            )

            response_data = serializer.to_representation(session_instance)
            response_data["new_level"] = new_level
            return Response(response_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
