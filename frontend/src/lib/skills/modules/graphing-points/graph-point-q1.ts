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
    displayName: 'Basic ordered pairs',
    sortOrder: 2,
    promptDescriptor,
    responseFeedbackGenerator: defaultResponseFeedbackGenerator,
    uiLayout: 'TextPromptGraphInput',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
    interactionMap: {
        'select-vertical-line': {
            layout: 'q1',
            render: null,
            behavior: { hoverEffect: 'vertical-line' },
            feedback: 'show-vertical-line',
        },
        'select-horizontal-line': {
            layout: 'q1',
            render: null,
            behavior: { hoverEffect: 'horizontal-line' },
            feedback: 'show-horizontal-line',
        },
        'select-horizontal-vertical-lines': {
            layout: 'q1',
            render: null,
            behavior: { hoverEffect: 'horizontal-vertical-lines' },
            feedback: 'show-horizontal-vertical-lines',
        },
        'select-point': {
            layout: 'q1',
            render: null,
            behavior: { hoverEffect: 'horizontal-vertical-lines' },
            feedback: 'show-axis-segments',
        },
    },
} as any);
