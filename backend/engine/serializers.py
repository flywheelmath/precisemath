import uuid
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from .models_prompt import (
    Category,
    SkillLevel,
    Prompt,
    Skill,
)
from .models_session import (
    Player,
    PromptResponse,
    Session,
)
from .logic.formatting import enrich_math_data
from .services import get_player_skill_level, resolve_player


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


class PromptResponseSerializer(serializers.Serializer):
    """Serializer for validating each player response in the payload."""

    prompt_id = serializers.UUIDField()
    sequence_index = serializers.IntegerField(min_value=1)
    was_correct = serializers.BooleanField()
    time_spent_ms = serializers.IntegerField(min_value=0)
    player_response = serializers.CharField(max_length=255, allow_blank=True)


class SessionPayloadSerializer(serializers.Serializer):
    """
    Serializer for validating and creating and updating a session with its player responses.
    If a session_id is provided, it updates the existing session.
    Otherwise, it creates a new session id.
    """

    session_id = serializers.UUIDField(required=False, allow_null=True)
    player_uuid = serializers.UUIDField(write_only=True)
    category_slug = serializers.SlugField(write_only=True)
    skill_slug = serializers.SlugField(write_only=True)
    start_time = serializers.DateTimeField(write_only=True)
    end_time = serializers.DateTimeField(write_only=True)
    total_correct = serializers.IntegerField(min_value=0, write_only=True)
    total_incorrect = serializers.IntegerField(min_value=0, write_only=True)
    device_info = serializers.CharField(
        max_length=255, required=False, allow_blank=True, write_only=True
    )
    is_final = serializers.BooleanField(default=False, write_only=True)
    responses = PromptResponseSerializer(many=True, write_only=True)

    def create(self, validated_data):
        """
        This method contains the logic to create the database objects after data validation.
        """
        session_id = validated_data.pop("session_id", None)
        responses_data = validated_data.pop("responses")
        player_uuid = validated_data.pop("player_uuid", None)

        try:
            player = resolve_player(str(player_uuid))
        except ObjectDoesNotExist as e:
            raise serializers.ValidationError(str(e))

        if session_id:
            session = self._update_existing_session(session_id, player, validated_data)
            self._upsert_responses(session, responses_data)
        else:
            session = self._create_new_session(player, validated_data)
            self._bulk_create_responses(session, responses_data)

        return session

    def _update_existing_session(self, session_id: uuid.UUID, player: Player, validated_data) -> Session:
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
            return session
        except Session.DoesNotExist:
            raise serializers.ValidationError("The specified session does not exist.")

    def _create_new_session(self, player: Player, validated_data) -> Session:
        try:
            category = Category.objects.get(slug=validated_data.pop("category_slug"))
            skill = Skill.objects.get(
                category=category,
                slug=validated_data.pop("skill_slug")
            )
        except (Category.DoesNotExist, Skill.DoesNotExist):
            raise serializers.ValidationError("The specified category or skill does not exist.")

        active_rank = get_player_skill_level(player, skill)
        skill_level_obj = SkillLevel.objects.filter(skill=skill, skill_level_rank=active_rank).first()

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

    def _upsert_responses(self, session: Session, responses_data) -> None:
        """
        Saves ongoing updates.
        Identifies rows already written by sequence index to reduce number of database writes during client sync cycles.
        """
        existing_indices = set(
            PromptResponse.objects.filter(session=session).values_list("sequence_index", flat=True)
        )
        new_responses = [r for r in responses_data if r["sequence_index"] not in existing_indices]
        if new_responses: self._bulk_create_responses(session, new_responses)

    def to_representation(self, instance):
        """Ensure the response always includes the session_id."""
        return {"session_id": instance.id}
