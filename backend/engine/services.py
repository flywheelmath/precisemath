import uuid
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Avg, Case, Count, FloatField, When
from .models_prompt import Skill, SkillLevel
from .models_session import (
    Player,
    PlayerSkillProfile,
    PromptResponse,
)
from .utils.pseudonyms import generate_pseudonym


def provision_guest_player() -> Player:
    player_uuid = uuid.uuid4()
    player = Player.objects.create(
        uuid=player_uuid,
        is_guest=True,
        pseudonym=generate_pseudonym(str(player_uuid))
    )
    return player


def resolve_player(player_uuid: str) -> Player:
    try:
        player = Player.objects.get(uuid=player_uuid)
    except (Player.DoesNotExist, ValueError):
        raise ObjectDoesNotExist("Player {player_uuid} invalid.")

    if player.is_guest:
        cache_key = f"guest_active_window_{player.uuid}"
        is_active = cache.get(cache_key)

        if not is_active:
            PlayerSkillProfile.objects.filter(player=player).delete()
            cache.set(cache_key, True, timeout=7200)
        else:
            cache.touch(cache_key, timeout=7200)

    return player


def get_player_skill_level(player: Player, skill: Skill) -> int:
    try:
        profile = PlayerSkillProfile.objects.get(player=player, skill=skill)
        return profile.player_skill_level
    except PlayerSkillProfile.DoesNotExist:
        return 99 if player.is_guest else 1


def update_player_skill_level(player: Player, skill: Skill, new_level: int) -> Player:
    profile, created = PlayerSkillProfile.objects.update_or_create(
        player=player,
        skill=skill,
        defaults={"player_skill_level": new_level},
    )
    return profile


def compute_player_skill_level(player: Player, skill: Skill):
    """
    Computes and updates the skill rank for specific Player.
    """
    response_ids = PromptResponse.objects.filter(
        session__player=player,
        prompt__skill_level__skill=skill
    ).order_by(
        '-session__start_time',
        '-sequence_index'
    ).values_list('id', flat=True)[:300]

    if not response_ids: return 1

    current_level = get_player_skill_level(player, skill)

    level_stats = PromptResponse.objects.filter(
        id__in=list(response_ids)
    ).values(
        'prompt__skill_level__skill_level_rank'
    ).annotate(
        count=Count('id'),
        accuracy=Avg(Case(When(was_correct=True, then=1.0), default=0.0, output_field=FloatField())),
        avg_ms=Avg('time_spent_ms')
    ).order_by('-prompt__skill_level__skill_level_rank')

    cumulative_count = 0
    cumulative_correct_count = 0.0
    cumulative_total_ms = 0.0

    frontier_rank = None
    stats = {}

    for entry in level_stats:
        count = entry['count']
        cumulative_count += count
        cumulative_correct_count += (entry['accuracy'] * count)
        cumulative_total_ms += (entry['avg_ms'] * count)

        if cumulative_count >= skill.stability_threshold and frontier_rank is None:
            frontier_rank = entry['prompt__skill_level__skill_level_rank']
            stats['accuracy'] = cumulative_correct_count / cumulative_count
            stats['avg_ms'] = cumulative_total_ms / cumulative_count

    if frontier_rank is None: return current_level

    ipm = 60000.0 / stats['avg_ms'] if stats['avg_ms'] > 0 else 0
    is_fluent = (stats['accuracy'] >= skill.target_accuracy and ipm >= skill.target_speed)

    new_level = current_level
    if is_fluent:
        if frontier_rank >= current_level:
            new_level = frontier_rank + 1
    else:
        if frontier_rank <= current_level and stats['accuracy'] < (skill.target_accuracy * 0.7):
            new_level = max(1, current_level - 1)

    if new_level != current_level:
        update_player_skill_level(player, skill, new_level)
        return new_level

    return current_level
