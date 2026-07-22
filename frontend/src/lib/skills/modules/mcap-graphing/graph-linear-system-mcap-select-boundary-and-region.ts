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
    displayName: 'System of inequalities: select boundary and region',
    sortOrder: 3,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout: 'MCAPSystemInequalityGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 120,
    interactionMap: {
        'system-boundary-and-region': {
            layout: 'full-plane',
            render: 'draw-system-inequalities',
            behavior: { hoverEffect: 'point' },
            feedback: 'show-system-inequalities',
            manualFeedback: true,
        }
    },
    defaultInteractionConfig: 'system-boundary-and-region'
}) as SkillModule;
