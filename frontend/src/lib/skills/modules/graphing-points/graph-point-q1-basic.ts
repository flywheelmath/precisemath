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
    displayName: 'Basic coordinates',
    sortOrder: 1,
    promptDescriptor,
    responseFeedbackGenerator: defaultResponseFeedbackGenerator,
    uiLayout: 'GraphPromptNumpadInput',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
    interactionMap: {
        'vertical-line-on-hover': {
            layout: 'q1',
            render: 'draw-point',
            interaction: 'select-vertical-line',
            behavior: { hoverEffect: 'vertical-line' },
            feedback: 'show-vertical-line',
        },
        'horizontal-line-on-hover': {
            layout: 'q1',
            render: 'draw-point',
            interaction: 'select-horizontal-line',
            behavior: { hoverEffect: 'horizontal-line' },
            feedback: 'show-horizontal-line',
        },
        'find-x-coordinate': {
            layout: 'q1',
            render: 'draw-point',
            interaction: 'select-vertical-line',
            behavior: { hoverEffect: 'point' },
            feedback: 'show-vertical-line',
        },
        'find-y-coordinate': {
            layout: 'q1',
            render: 'draw-point',
            interaction: 'select-horizontal-line',
            behavior: { hoverEffect: 'point' },
            feedback: 'show-horizontal-line',
        },
    },
} as any); 
