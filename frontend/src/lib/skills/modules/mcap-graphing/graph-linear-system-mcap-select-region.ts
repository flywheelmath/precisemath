import { defineSkill } from '@/lib/skills/define';
import type { Prompt, SkillModule } from '@/types';

const promptDescriptor = {
    describe(prompt: Prompt): string {
        if (prompt.prompt_text !== undefined) {
            return prompt.prompt_text;
        }
        return `...${prompt.id.slice(-6)}`;
    }
};

const responseFeedbackGenerator = {
    generateIncorrectResponseFeedback: () => null
};

export default defineSkill({
    displayName: 'System of inequalities: select region',
    sortOrder: 2,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout: 'MCAPSystemInequalityGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 60,
    interactionMap: {
        'system-region-only': {
            layout: 'full-plane',
            render: 'draw-system-inequalities',
            behavior: { hoverEffect: 'point' },
            feedback: 'show-system-inequalities',
            manualFeedback: true,
        }
    },
    defaultInteractionConfig: 'system-region-only'
}) as SkillModule;
