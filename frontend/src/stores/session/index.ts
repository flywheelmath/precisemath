// src/stores/session/index.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { useSessionApi } from './useSessionApi';
import { useSessionEngine } from './useSessionEngine';
import { useSessionFeedback } from './useSessionFeedback';
import { useSessionSync } from '@/composables/useSessionSync';
import { getSkillModule } from '@/lib/skills/registry';
import type { SessionPayload } from '@/types';

export const useSessionStore = defineStore('session', () => {
    const apiStore = useSessionApi();
    const engineStore = useSessionEngine();
    const feedbackStore = useSessionFeedback();
    const syncStore = useSessionSync();

    const startTimeStr = ref<string>('');
    const guestName = ref<string>('');

    const moduleKey = computed(() => {
        if (!apiStore.categorySlug.value || !apiStore.skillSlug.value) return null;
        return `${apiStore.categorySlug.value}/${apiStore.skillSlug.value}`;
    });

    const skillModule = computed(() => {
        if (!moduleKey.value) return null;
        return moduleKey.value ? getSkillModule(moduleKey.value) : null;
    });

    async getSessionPayload(isFinal = false): SessionPayload | null {
        if (!startTimeStr.value || engineStore.sessionLog.value.history.length === 0) return null; 

        return {
            session_id: syncStore.sessionId.value || undefined,
            category_slug: apiStore.categorySlug.value,
            skill_slug: apiStore.skillSlug.value,
            start_time: startTimeStr.value,
            end_time: new Date().toISOString(),
            total_correct: engineStore.sessionLog.value.score.correct,
            total_incorred: engineStore.sessionLog.value.score.incorrect,
            responses: engineStore.sessionLog.value.history,
            guest_username: guestName.value || undefined,
            is_final: isFinal,
        };
    }

    async function initAndStartSession(category: string, skill: string) {
        apiStore.resetData();
        engineStore.resetEngine();
        feedbackStore.clearFeedback();

        await apiStore.fetchSessionData(category, skill);

        engineStore.initialize(
            apiStore.allPrompts.value,
            apiStore.skillLevels.value,
            apiStore.playerSkillLevel.value ?? 1,
            apiStore.sessionDurationSeconds.value
        );

        startTimeStr.value = new Date().toISOString();
        engineStore.start();

        syncStore.startAutoSync(() => getSessionPayload(false), apiStore.submitSessionResults);
    }

    function handleSubmission(playerResponse: any, responseStr: string) {
        if (!engineStore.currentPrompt.value || !moduleKey.value) return;

        const result = engineStore.scoreAndAdvance(playerResponse, responseStr);
        if (!result) return;

        const config = feedbackStore.generateFeedback(
            engineStore.currentPrompt.value,
            responseStr,
            playerResponse,
            result.isCorrect,
            moduleKey.value,
            apiStore.skillLevels.value,
        );

        if (config?.feedback) {
            feedbackStore.triggerManualFeedback(config.feedbackDuration || 2000);
        }
    }

    function forceAdvanceIncorrect(responseStr: string) {
        engineStore.advanceIncorrect(responseStr);
        feedbackStore.clearFeedback();
    }

    function finishSession() {
        engineStore.end();
        syncStore.stopAutoSync();

        const finalPayload = getSessionPayload(true);
        if (finalPayload) {
            try {
                await syncStore.executeSync(finalPayload, apiStore.submitSessionResults);
            }
            catch (error) {
                console.error("Failed to submit session results:", error);
            }
        }
    }

    function endSession() {
        engineStore.end();
        apiStore.resetData();
        feedbackStore.clearFeedback();
        syncStore.resetSyncState();
        startTimeStr.value = '';
    }

    async function handleTimeUp() {
        await finishSession();
    }

    return {
        ...apiStore,
        ...engineStore,
        ...feedbackStore,

        sessionId: syncStore.sessionId,
        isSyncing: syncStore.isSyncing,

        moduleKey,
        skillModule,

        initAndStartSession,
        handleSubmission,
        forceAdvanceIncorrect,
        finishSession,
        endSession,
        handleTimeUp,
    };
});
