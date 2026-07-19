from django.db.models import Avg, Case, Count, FloatField, When
<<<<<<< Updated upstream
from .models import (
=======
from .models_session import (
>>>>>>> Stashed changes
    PromptResponse,
    PlayerSkillProfile,
)

def compute_player_skill_level(player, skill):
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

    profile, _ = PlayerSkillProfile.objects.get_or_create(player=player, skill=skill)
    if frontier_rank is None:
        return profile.player_skill_level

    ipm = 60000.0 / stats['avg_ms'] if stats['avg_ms'] > 0 else 0
    is_fluent = (stats['accuracy'] >= skill.target_accuracy and ipm >= skill.target_speed)

    if is_fluent:
        if frontier_rank >= profile.player_skill_level:
            profile.player_skill_level = frontier_rank + 1
    else:
        if frontier_rank <= profile.player_skill_level and stats['accuracy'] < (skill.target_accuracy * 0.7):
            profile.player_skill_level = max(1, profile.player_skill_level - 1)

    profile.save()
    return profile.player_skill_level
