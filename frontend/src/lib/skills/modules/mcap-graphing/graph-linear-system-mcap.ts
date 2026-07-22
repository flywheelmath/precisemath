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
    displayName: 'MCAP Systems of Inequalities',
    sortOrder: 4,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout: 'MCAPSystemInequalityGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 120,
    interactionMap: {
        'graph-linear-system-mcap-default': {
            layout: 'full-plane-mcap',
            render: 'draw-system-inequalities',
            behavior: { hoverEffect: 'point' },
            feedback: 'show-system-inequalities',
            manualFeedback: true,
        }
    },
    defaultInteractionConfig: 'graph-linear-system-mcap-default'
}) as SkillModule;
