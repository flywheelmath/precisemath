import json
import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from jsonschema import validate
from jsonschema.exceptions import ValidationError as JSONSchemaValidationError


class InteractionType(models.Model):
    name = models.CharField(
        max_length=50, unique=True, help_text="Name of the interaction type."
    )
    slug = models.CharField(
        max_length=50, unique=True, help_text="Slug for the category."
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Interaction type"
        verbose_name_plural = "Interaction types"

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(
        max_length=50, unique=True, help_text="Name of the category."
    )
    slug = models.CharField(
        max_length=50, unique=True, help_text="Slug for the category."
    )

    class Meta:
        ordering = ["name", "slug"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Skill(models.Model):
    name = models.CharField(max_length=80, help_text="Name of the skill.")
    slug = models.CharField(max_length=80, help_text="Slug for the skill.")
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="skills",
        help_text="Category of the skill.",
    )
    fluency_window = models.IntegerField(default=100)
    stability_threshold = models.IntegerField(default=20)
    target_accuracy = models.FloatField(default=0.85)
    target_speed = models.FloatField(default=5)

    class Meta:
        ordering = ["category", "name"]
        unique_together = (
            ("category", "name"),
            ("category", "slug"),
        )
        verbose_name = "Skill"
        verbose_name_plural = "Skills"

    def __str__(self):
        return self.name


class SkillLevel(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="skill_levels_by_category",
        help_text="Category of the skill.",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="skill_levels_by_skill",
        help_text="Skill of the skill level.",
    )
    name = models.CharField(max_length=80, help_text="Name of the skill level.")
    slug = models.CharField(max_length=80, help_text="Slug of the skill level.")
    parent = models.ManyToManyField(
        "self", blank=True, help_text="Slugs of parent levels of the skill."
    )
    json_schema = models.JSONField(
        blank=True,
        null=True,
        help_text="JSON schema for the prompt data associated with this skill level. Required for schema validation.",
    )
    description = models.TextField(
        help_text="Description of the skill level.",
        blank=True,
        null=True,
    )
    prompt_template = models.TextField(
        blank=True,
        null=True,
        help_text="Template string for displaying the prompt, e.g., '{multiplicand1} \\times {multiplicand2}'.",
    )
    interaction_config = models.CharField(
        max_length=255, blank=True, null=True, help_text="UI interaction details."
    )
    skill_level_rank = models.IntegerField(
        blank=True,
        null=True,
        help_text="Position of the skill level in the sequence of skill levels for the skill.",
    )

    class Meta:
        ordering = ["skill", "skill_level_rank", "name"]
        unique_together = (("skill", "name"), ("skill", "slug"))
        verbose_name = "Skill level"
        verbose_name_plural = "Skill levels"

    def __str__(self):
        return self.name


class Prompt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    skill_level = models.ForeignKey(
        SkillLevel,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        help_text="Level of the skill targeted by the prompt.",
    )
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Data defining the content of the prompt. JSON Schema defined in Skill Level instance.",
    )
    operand1 = models.IntegerField(
            blank=True,
            null=True,
            )
    operand2 = models.IntegerField(
            blank=True,
            null=True,
            )
    correct_response = models.JSONField(
        default=dict,
        blank=True,
        null=True,
    )
    correct_response_number = models.IntegerField(
        # delete column: replaced by correct_resposne JSON field
        blank=True,
        null=True,
        help_text="Correct numerical response for the prompt.",
    )
    correct_response_string = models.CharField(
        # delete column: replaced by correct_resposne JSON field
        max_length=255,
        blank=True,
        null=True,
        help_text="Correct string response for the prompt.",
    )
    correct_response_array = ArrayField(
        # delete column: replaced by correct_resposne JSON field
        models.IntegerField(),
        default=list,
        blank=True,
        null=True,
        help_text="Correct array response for the prompt.",
    )
    prompt_rank = models.IntegerField(
        blank=True,
        null=True,
        help_text="Position of the prompt in a sequence of prompts at this skill level.",
    )
    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["skill_level", "prompt_rank"]
        unique_together = ["skill_level", "data"]
        indexes = [
            GinIndex(fields=["data"]),
        ]
        verbose_name = "Prompt"
        verbose_name_plural = "Prompts"

    def clean(self):
        super().clean()
        if self.skill_level and self.skill_level.json_schema:
            try:
                validate(instance=self.data, schema=self.skill_level.json_schema)
            except JSONSchemaValidationError as e:
                raise ValidationError(
                    f"JSON data does not conform to the schema for this skill level: {e.message}"
                )

    def __str__(self):
        return f"{self.skill_level}.{self.data}"


class Session(models.Model):
    """
    Represents a single practice session undertaken by a user.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions",
        help_text="Username of the registered user for this session.",
    )
    guest_username = models.CharField(
        max_length=50,
        blank=True,
        help_text="Username provided by a guest user for this session.",
    )
    user_skill_level = models.ForeignKey(
        SkillLevel,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        help_text="User's skill level at the time of the session.",
    )
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="sessions")
    start_time = models.DateTimeField(
        help_text="The UTC timestamp when the session started."
    )
    end_time = models.DateTimeField(
        help_text="The UTC timestamp when the session ended."
    )
    total_correct = models.PositiveIntegerField()
    total_incorrect = models.PositiveIntegerField()
    device_info = models.CharField(max_length=255, blank=True)

    @property
    def duration(self):
        """Calculates the duration of the session."""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return None

    class Meta:
        ordering = ["-end_time"]

    def __str__(self):
        if self.user:
            user_str = getattr(self.user, "username", str(self.user.id))
        elif self.guest_username:
            user_str = self.guest_username
        else:
            user_str = "anonymous"
        return (
            f"{user_str}.{self.skill.name}.{self.end_time.strftime('%Y-%m-%d %H:%M')}"
        )


class PromptResponse(models.Model):
    """
    Represents a single response to a prompt during a session.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        Session, on_delete=models.CASCADE, related_name="responses"
    )
    prompt = models.ForeignKey(
        Prompt, on_delete=models.PROTECT, related_name="responses"
    )
    sequence_index = models.PositiveIntegerField(
        help_text="Index of this response in the session."
    )
    was_correct = models.BooleanField()
    time_spent_ms = models.PositiveIntegerField(
        help_text="Time spend on prompt in milliseconds."
    )
    interaction_type = models.ForeignKey(
        InteractionType,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        help_text="Interaction type of the response.",
    )
    interaction_config = models.CharField(
        # delete this column in the interest of decoupling backend and frontend
        max_length=255,
        blank=True,
        null=True,
        help_text="UI interaction details.",
    )
    user_response = models.CharField(
        max_length=255, help_text="User's submitted response."
    )

    class Meta:
        ordering = ["session", "sequence_index"]
        unique_together = ["session", "sequence_index"]

    def __str__(self):
        return f"{self.session_id}.{self.sequence_index}"


class UserSkillProfile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    user_skill_level = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ["user", "skill"]
