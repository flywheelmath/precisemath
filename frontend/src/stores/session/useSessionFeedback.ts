// src/stores/session/useSessionFeedback.ts

import { ref } from 'vue';
import { getSkillModule } from '@/lib/skills/registry';
import type { FeedbackState, Prompt, SkillLevelData } from '@/types';

export function useSessionFeedback() {
    const isShowingFeedback = ref(false);
    const isFeedbackLocked = ref(false);
    const feedbackMessage = ref<string | null>(null);
    const feedbackTimer = ref<number | null>(null);

    const feedbackState = ref<FeedbackState>({
        type: null,
        isCorrect: false,
        playerResponse: null,
        correctResponse: null,
    })

    function generateFeedback(
        prompt: Prompt,
        responseStr: string,
        rawResponse: any,
        isCorrect: boolean,
        moduleKey: string,
        skillLevels: SkillLevelData[],
    ) {
        const meta = skillLevels.find(l => l.skill_level_rank === prompt.skill_level_rank);
        if (!meta) return null;

        const module = getSkillModule(moduleKey);
        const configKey = meta.interaction_config || 'default';
        const map = module?.interactionMap || {};
        const config = map[configKey] || map['default'];

        if (isCorrect) {
            feedbackMessage.value = "Correct!";
            feedbackState.value = {
                type: config?.feedback || null,
                isCorrect: true,
                playerResponse: rawResponse,
                correctResponse: prompt.correct_response?.value ?? null,
            };
            return config;
        }

        const generatedMsg = module?.responseFeedbackGenerator?.generateIncorrectResponseFeedback(prompt, responseStr);
        let msg = generatedMsg;
        if (!msg && !config?.feedback) { msg = "Incorrect"; }
        feedbackMessage.value = msg || null;

        if (config?.feedback) {
            feedbackState.value = {
                type: config.feedback,
                isCorrect: false,
                playerResponse: rawResponse,
                correctResponse: prompt.correct_response?.value ?? null,
            };
        }

        return config;
    }

    function triggerManualFeedback(duration = 2000) {
        if (feedbackTimer.value) {
            window.clearTimeout(feedbackTimer.value);
        }
        isShowingFeedback.value = true;
        isFeedbackLocked.value = true;

        feedbackTimer.value = window.setTimeout(() => {
            isFeedbackLocked.value = false;
            feedbackTimer.value = null;
        }, duration);
    }

    function clearFeedback() {
        if (feedbackTimer.value) {
            window.clearTimeout(feedbackTimer.value);
            feedbackTimer.value = null;
        }
        feedbackMessage.value = null;
        feedbackState.value = { type: null, isCorrect: false, playerResponse: null, correctResponse: null };
        isShowingFeedback.value = false;
        isFeedbackLocked.value = false;
    }

    return {
        isShowingFeedback,
        isFeedbackLocked,

        feedbackMessage,
        feedbackState,

        generateFeedback,
        triggerManualFeedback,
        clearFeedback,
    }
}
