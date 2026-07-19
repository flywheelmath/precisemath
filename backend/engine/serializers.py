from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import serializers
from .models_prompt import (
    Category,
    SkillLevel,
    Prompt,
    Skill,
)
from .models_session import (
    PromptResponse,
    Session,
    Player,
    PlayerSkillProfile,
)
from .logic.formatting import enrich_math_data
from .services import compute_player_skill_level
from .utils.pseudonyms import generate_pseudonym

User = get_user_model()


class ExcludeNullFieldsSerializer(serializers.ModelSerializer):
    """
    ModelSerializer that excludes fields with a value of None.
    """

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        return {
            key: value
            for key, value in ret.items()
            if value is not None and value != []
        }


class SkillLevelDataSerializer(ExcludeNullFieldsSerializer):
    """
    Serializes metadata for a SkillLevel.
    """

    class Meta:
        model = SkillLevel
        fields = ["id", "skill_level_rank", "slug", "name", "interaction_config"]


class PromptSerializer(ExcludeNullFieldsSerializer):
    """
    Serializes Prompt objects for the game session.
    This determines the JSON representation of a prompt.
    """

    skill_level_rank = serializers.IntegerField(
        source="skill_level.skill_level_rank", read_only=True
    )
    prompt_text = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    class Meta:
        model = Prompt
        fields = [
            "id",
            "skill_level_rank",
            "prompt_text",
            "data",
            "correct_response",
        ]

    def get_data(self, obj):
        return enrich_math_data(obj.data)

    def get_prompt_text(self, obj):
        template = obj.skill_level.prompt_template
        enriched_data = self.get_data(obj)

        try:
            return template.format(**enriched_data)
        except (KeyError, ValueError) as e:
            return f"Error formatting prompt: {str(e)}"


class PromptResponseCreateSerializer(serializers.Serializer):
    """Serializer for validating each player response in the payload."""

    prompt_id = serializers.UUIDField()
    sequence_index = serializers.IntegerField(min_value=1)
    was_correct = serializers.BooleanField()
    time_spent_ms = serializers.IntegerField(min_value=0)
    player_response = serializers.CharField(max_length=255, allow_blank=True)

    class Meta:
        fields = [
            "prompt_id",
            "sequence_index",
            "was_correct",
            "time_spent_ms",
            "player_response",
        ]


class SessionCreateSerializer(serializers.Serializer):
    """
    Serializer for validating and creating and updating a session with its player responses.
    If a session_id is provided, it updates the existing session.
    Otherwise, it creates a new session id.
    """

    session_id = serializers.UUIDField(required=False, allow_null=True)
    category_slug = serializers.SlugField(write_only=True)
    skill_slug = serializers.SlugField(write_only=True)
    start_time = serializers.DateTimeField(write_only=True)
    end_time = serializers.DateTimeField(write_only=True)
    total_correct = serializers.IntegerField(min_value=0, write_only=True)
    total_incorrect = serializers.IntegerField(min_value=0, write_only=True)
    device_info = serializers.CharField(
        max_length=255, required=False, allow_blank=True, write_only=True
    )
    guest_token = serializers.CharField(
        max_length=50, required=False, allow_blank=True, write_only=True
    )
    is_final = serializers.BooleanField(default=False, write_only=True)
    responses = PromptResponseCreateSerializer(many=True, write_only=True)

    def create(self, validated_data):
        """
        This method contains the logic to create the database objects after data validation.
        """
        user = self.context["request"].user
        session_id = validated_data.pop("session_id", None)
        responses_data = validated_data.pop("responses")
        guest_token = validated_data.pop("guest_token", None)
        is_final = self.initial_data.get("is_final", False)

        player = Player.objects.resolve_player(user, guest_token)
        player.check_cache_window()

        if session_id:
            session = self._update_existing_session(session_id, player, validated_data)
        else:
            session = self._create_new_session(player, validated_data)

        self._bulk_create_responses(session, responses_data)

        if is_final:
            compute_player_skill_level(player=player, skill=session.skill)

        return session

    def _update_existing_session(self, session_id, player: Player, validated_data) -> Session:
        try:
            session = Session.objects.get(id=session_id)
            if session.player != player:
                raise serializers.ValidationError(
                    "You do not have permission to update this session."
                )
            session.end_time = validated_data.get("end_time", session.end_time)
            session.total_correct = validated_data.get(
                "total_correct", session.total_correct
            )
            session.total_incorrect = validated_data.get(
                "total_incorrect", session.total_incorrect
            )
            session.save()

            PromptResponse.objects.filter(session=session).delete()
            return session
        except Session.DoesNotExist:
            raise serializers.ValidationError(
                "The specified session does not exist."
            )

    def _create_new_session(self, player: Player, validated_data) -> Session:
        try:
            category = Category.objects.get(
                slug=validated_data.pop("category_slug")
            )
            skill = Skill.objects.get(
                category=category, slug=validated_data.pop("skill_slug")
            )
        except (Category.DoesNotExist, Skill.DoesNotExist):
            raise serializers.ValidationError(
                "The specified category or skill does not exist."
            )

        profile, _ = PlayerSkillProfile.objects.get_or_create_profile(player, skill)

        try:
            skill_level_obj = SkillLevel.objects.get(skill=skill, skill_level_rank=profile.player_skill_level)
        except SkillLevel.DoesNotExist:
            skill_level_obj = None

        return Session.objects.create(
            player=player,
            skill=skill,
            player_skill_level=skill_level_obj,
            **validated_data
        )

    def _bulk_create_responses(self, session: Session, responses_data) -> None:
        prompts_to_create = []
        for resp in responses_data:
            try:
                prompt_obj = Prompt.objects.get(id=resp["prompt_id"])
            except Prompt.DoesNotExist:
                raise serializers.ValidationError(f"Prompt with ID {resp['prompt_id']} does not exist.")
            prompts_to_create.append(
                PromptResponse(
                    session=session,
                    prompt=prompt_obj,
                    sequence_index=resp["sequence_index"],
                    was_correct=resp["was_correct"],
                    time_spent_ms=resp["time_spent_ms"],
                    player_response=resp["player_response"],
                )
            )
        PromptResponse.objects.bulk_create(prompts_to_create)

    def to_representation(self, instance):
        """Ensure the response always includes the session_id."""
        return {"session_id": instance.id}
