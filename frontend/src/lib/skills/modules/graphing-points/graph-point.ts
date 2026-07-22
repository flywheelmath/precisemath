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
    displayName: 'Ordered pairs',
    sortOrder: 4,
    promptDescriptor,
    responseFeedbackGenerator: defaultResponseFeedbackGenerator,
    uiLayout: 'TextPromptGraphInput',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
    interactionMap: {
        'select-vertical-line': {
            layout: 'full-plane',
            interaction: 'point',
            render: null,
            behavior: { hoverEffect: 'vertical-line' },
            feedback: 'show-vertical-line',
        },
        'select-horizontal-line': {
            layout: 'full-plane',
            interaction: 'point',
            render: null,
            behavior: { hoverEffect: 'horizontal-line' },
            feedback: 'show-horizontal-line',
        },
        'select-horizontal-vertical-lines': {
            layout: 'full-plane',
            interaction: 'point',
            render: null,
            behavior: { hoverEffect: 'point' },
            feedback: 'show-horizontal-vertical-lines',
        },
        'select-point': {
            layout: 'full-plane',
            interaction: 'point',
            render: null,
            behavior: { hoverEffect: 'point' },
            feedback: 'show-axis-segments',
        },
    },
} as any); 
