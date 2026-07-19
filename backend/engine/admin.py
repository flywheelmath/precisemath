import json
from django.contrib import admin
from django.forms import widgets
from django.db import models

from .models_prompt import (
    InteractionType,
    Category,
    Skill,
    SkillLevel,
    Prompt,
)
from .models_session import (
    Player,
    PromptResponse,
    Session
)




@admin.register(InteractionType)
class InteractionTypeAdmin(admin.ModelAdmin):
    search_fields = ("name", "slug")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    list_filter = ("name",)
    search_fields = ("name", "slug")


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    list_filter = ("name", "category")
    search_fields = ["name", "category__name", "slug"]


class JSONWidget(widgets.Textarea):
    def format_value(self, value):
        if value:
            try:
                return json.dumps(
                    value,
                    indent=2,
                    ensure_ascii=False,
                )
            except TypeError:
                return super().format_value(value)
        return super().format_value(value)


@admin.register(SkillLevel)
class SkillLevelAdmin(admin.ModelAdmin):
    list_display = ("skill", "name", "skill_level_rank")
    list_filter = ("skill", "name")
    search_fields = ("skill__name", "skill__slug", "name", "slug")
    formfield_overrides = {models.JSONField: {"widget": JSONWidget}}


@admin.register(Prompt)
class PromptAdmin(admin.ModelAdmin):
    list_display = (
        "skill_level__skill",
        "skill_level",
        "data",
        "is_active",
    )
    list_editable = ("is_active",)
    list_filter = ("skill_level__skill", "skill_level", "is_active")
    search_fields = (
        "skill_level__skill__name",
        "skill_level__skill__slug",
        "skill_level__name",
        "skill_level__slug",
    )


@admin.register(Player)
class PlayerInline(admin.ModelAdmin):
    list_display = ("user", "pseudonym", "is_guest")
    search_fields = ("user", "pseudonym", "is_guest")


class PromptResponseInline(admin.TabularInline):
    """
    Makes the PromptResponse model editable directly within the Session admin page.
    """

    model = PromptResponse
    list_display = ("prompt", "was_correct", "time_spent_ms", "player_response")
    readonly_fields = ("prompt", "was_correct", "time_spent_ms", "player_response")
    can_delete = False
    extra = 0


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Session model.
    """

    list_display = ("player", "skill", "total_correct", "total_incorrect", "duration")
    list_filter = ("skill", "player", "start_time")
    search_fields = ("player", "skill__name")
    inlines = [PromptResponseInline]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return [field.name for field in self.model._meta.fields]
        return []


@admin.register(PromptResponse)
class PromptResponseAdmin(admin.ModelAdmin):
    raw_id_fields = ("session", "prompt")
    list_display = ("session", "prompt", "was_correct", "time_spent_ms")
    list_filter = ("was_correct", "session__skill")
