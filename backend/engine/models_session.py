import uuid
from django.core.cache import cache
from django.db import models
from django.conf import settings

from .models_prompt import (
    InteractionType,
    Category,
    Skill,
    SkillLevel,
    Prompt
)
from engine.utils.pseudonyms import generate_pseudonym


class PlayerManager(models.Manager):
    def resolve_player(self, user, guest_token=None):
        if user and user.is_authenticated:
            if hasattr(user, "player"):
                return user.player
            player, _ = self.get_or_create(
                domain_identifier=f"auth_user_{user.id}",
                defaults={"user": user, "is_guest": False}
            )
            return player

        pseudonym = generate_pseudonym(guest_token, is_guest=True)
        player, _ = self.get_or_create(
            domain_identifier=guest_token,
            defaults={"is_guest": True, "pseudonym": pseudonym}
        )
        return player


class Player(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="player"
    )
    domain_identifier = models.CharField(
        max_length=64,
        unique=True
    )
    pseudonym = models.CharField(max_length=64, unique=True)
    is_guest = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = PlayerManager()

    def check_cache_window(self):
        if not self.is_guest: return

        cache_key = f"guest_active_window_{self.domain_identifier}"
        is_active = cache.get(cache_key)

        if not is_active:
            PlayerSkillProfile.objects.filter(player=self).update(player_skill_level=99)
            cache.set(cache_key, True, timeout=7200)
        else:
            cache.touch(cache_key, timeout=7200)

    def __str__(self):
        return self.pseudonym


class PlayerSkillProfileManager(models.Manager):
    def get_or_create_profile(self, player, skill):
        default_rank = 99 if player.is_guest else 1
        return self.get_or_create(
            player=player,
            skill=skill,
            defaults={"player_skill_level": default_rank}
        )

    def get_profile_rank(self, player, skill):
        profile, _ = self.get_or_create_profile(player, skill)
        return profile.player_skill_level


class PlayerSkillProfile(models.Model):
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        blank=True
    )
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    player_skill_level = models.PositiveIntegerField(default=1)

    objects = PlayerSkillProfileManager()

    class Meta:
        unique_together = ["player", "skill"]


class Session(models.Model):
    """
    Represents a single practice session undertaken by a player.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        null=False,
        blank=True
    )
    player_skill_level = models.ForeignKey(
        SkillLevel,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        help_text="Player's skill level at the time of the session.",
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
        return (
            f"{self.player} - {self.skill.name} - {self.end_time.strftime('%Y-%m-%d %H:%M')}"
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
    player_response = models.CharField(
        max_length=255, help_text="Player's submitted response."
    )

    class Meta:
        ordering = ["session", "sequence_index"]
        unique_together = ["session", "sequence_index"]

    def __str__(self):
        return f"{self.session_id}.{self.sequence_index}"
