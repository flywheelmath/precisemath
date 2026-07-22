import { defineSkill } from '@/lib/skills/define';
import type { Prompt, ResponseFeedbackGenerator } from '@/types';

const promptDescriptor = {
    describe(prompt: Prompt): string {
        if (prompt.prompt_text !== undefined) {
            return prompt.prompt_text;
        }
        return `...${prompt.id.slice(-6)}`;
    }
};

const defaultResponseFeedbackGenerator: ResponseFeedbackGenerator = {
    generateIncorrectResponseFeedback: () => null 
};

export default defineSkill({
    displayName: 'Coordinates',
    sortOrder: 3,
    promptDescriptor,
    responseFeedbackGenerator: defaultResponseFeedbackGenerator,
    uiLayout: 'GraphPromptNumpadInput',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
    interactionMap: {
        'vertical-line-on-hover': {
            layout: 'full-plane',
            render: 'draw-point', 
            behavior: { hoverEffect: 'vertical-line' },
            feedback: 'show-vertical-line',
        },
        'horizontal-line-on-hover': {
            layout: 'full-plane',
            render: 'draw-point',
            behavior: { hoverEffect: 'horizontal-line' },
            feedback: 'show-horizontal-line',
        },
        'find-x-coordinate': {
            layout: 'full-plane',
            render: 'draw-point',
            feedback: 'show-vertical-line',
        },
        'find-y-coordinate': {
            layout: 'full-plane',
            render: 'draw-point',
            feedback: 'show-horizontal-line',
        },
    },
    defaultInteractionConfig: 'default',
} as any);
