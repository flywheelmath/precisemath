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
    displayName: 'MCAP Quadratics',
    sortOrder: 5,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout: 'MCAPParabolaGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 60,
    interactionMap: {
        'graph-parabola-mcap': {
            layout: 'full-plane-mcap',
            render: 'draw-parabola', 
            behavior: { hoverEffect: 'point' },
            feedback: 'show-parabola',
            manualFeedback: true,
        }
    },
    defaultInteractionConfig: 'graph-parabola-mcap'
}) as SkillModule;
