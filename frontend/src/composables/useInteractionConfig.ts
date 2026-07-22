import { computed } from 'vue';
import type { Ref } from 'vue';
import { getSkillModule } from '@/lib/skills/registry';
import type { Prompt, SkillLevelData } from '@/types';

export function useInteractionConfig(
    categorySlug: Ref<string>,
    skillSlug: Ref<string>,
    currentPrompt: Ref<Prompt | null>,
    skillLevels: Ref<SkillLevelData[]>
) {
    const module = computed(() => getSkillModule(`${categorySlug.value}/${skillSlug.value}`));
    const currentLevelMetadata = computed(() => {
	if (!currentPrompt.value) return null;
	return skillLevels.value.find(l => l.skill_level_rank === currentPrompt.value!.skill_level_rank);
    });
    const interactionConfig = computed(() => {
	return currentLevelMetadata.value?.interaction_config || 'default';
    });
    const config = computed(() => {
        if (!currentLevelMetadata.value || !module.value) return null;
        const map = module.value.interactionMap || {};
        return map[interactionConfig.value] || map['default'] || null;
    });

    const activeLayout = computed(() => {
        return module.value?.uiLayout || 'TextPromptNumpadInput';
    });

    const canvasConfigName = computed(() => config.value?.layout || 'full-plane');

    const renderMode = computed(() => config.value?.render || null);
    const interactionMode = computed(() => config.value?.behavior?.hoverEffect || null);
    const feedbackMode = computed(() => config.value?.feedback || null);

    return {
        activeLayout,
        canvasConfigName,
        renderMode,
        interactionMode,
        feedbackMode,
	interactionConfig
    };
}
