// src/stores/session/useSessionEngine.ts

import {ref, shallowRef } from 'vue';
import { SessionEngine } from '@/lib/session/engine';
import { scorePrompt } from '@/lib/scoring/checker';
import type { Prompt, SessionLog, SkillLevelData } from '@/types';

export function useSessionEngine() {
    const engine = shallowRef<SessionEngine | null>(null);
    const currentPrompt = ref<Prompt | null>(null);
    const sessionLog = ref<SessionLog>({ history: [], score: { correct: 0, incorrect: 0 } });

    function initialize(prompts: Prompt[], skillLevels: SkillLevelData[], playerLevel: number, duration: number) {
        engine.value = new SessionEngine(prompts, skillLevels, playerLevel, duration);
    }

    function start() {
        if (!engine.value) return;
        engine.value.start();
        currentPrompt.value = engine.value.currentPrompt;
    }

    function scoreAndAdvance(playerResponse: any, responseStr: string) {
        if (!engine.value || !currentPrompt.value) return null;

        const result = scorePrompt(currentPrompt.value, playerResponse);

        if (result.isCorrect) {
            const nextPrompt = engine.value.submitAnswer(result, responseStr);
            sessionLog.value = { ...engine.value.history };
            currentPrompt.value = nextPrompt;
            return { isCorrect: true, nextPrompt };
        }

        return { isCorrect: false, result }
    }

    function advanceIncorrect(responseStr: string) {
        if (!engine.value) return null;

        const nextPrompt = engine.value.submitAnswer({ isCorrect: false }, responseStr);
        sessionLog.value = { ...engine.value.history };
        currentPrompt.value = nextPrompt;
        return nextPrompt;
    }

    function end() {
        if (engine.value) engine.value.end();
    }

    function resetEngine() {
        engine.value = null;
        currentPrompt.value = null;
        sessionLog.value = { history: [], score: { correct: 0, incorrect: 0 } };
    }

    return {
        engine,

        currentPrompt,
        sessionLog,

        initialize,
        start,
        scoreAndAdvance,
        advanceIncorrect,
        end,
        resetEngine,
    }
}
