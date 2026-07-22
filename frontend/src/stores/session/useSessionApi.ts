// src/stores/session/usedSessionApi.ts

import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { getSkillModule } from '@/lib/skills/registry';
import { computeSessionDuration } from '@/lib/session/duration';
import type { Prompt, PlayerSkillProfile, SessionPayload, SkillLevelData } from '@/types';

export function useSessionApi() {
    const categorySlug = ref('');
    const skillSlug = ref('');
    const playerSkillLevel = ref<number | null>(null);
    const allPrompts = ref<Prompt[]>([]);
    const skillLevels = ref<SkillLevelData[]>([]);

    const sessionDurationSeconds = computed(() => {
        if (!categorySlug.value || !skillSlug.value) return 60;

        const skillModule = getSkillModule(`${categorySlug.value}/${skillSlug.value}`);
        return computeSessionDuration(skillModule, playerSkillLevel.value);
    });

    async function fetchSessionData(category: string, skill: string) {
        categorySlug.value = category;
        skillSlug.value = skill;

        const levelData = await api.get<PlayerSkillProfile>(`/engine/player/level/${category}/${skill}/`);
        playerSkillLevel.value = levelData.data.player_skill_level;

        const promptData = await api.get(`/engine/sessions/prompts/${category}/${skill}/?player_skill_level=${playerSkillLevel.value}`);

        allPrompts.value = promptData.data.prompts;
        skillLevels.value = promptData.data.skill_levels || [];
    }

    async function submitSessionPayload(payload: SessionPayload) {
        if (!categorySlug.value || !skillSlug.value) return;
        await api.post(`/engine/sessions/`, payload);
    }

    function resetData() {
        categorySlug.value = '';
        skillSlug.value = '';
        allPrompts.value = [];
        skillLevels.value = [];
        playerSkillLevel.value = null;
    }

    return {
        categorySlug,
        skillSlug,
        playerSkillLevel,

        allPrompts,
        skillLevels,
        sessionDurationSeconds,

        fetchSessionData,
        submitSessionPayload,
        resetData
    };
}
