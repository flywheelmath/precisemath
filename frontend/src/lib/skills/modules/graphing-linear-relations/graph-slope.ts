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
    displayName: 'Slope',
    sortOrder: 1,
    promptDescriptor,
    responseFeedbackGenerator: defaultResponseFeedbackGenerator,
    uiLayout: 'TextPromptGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 60,
    interactionMap: {
        'select-point': {
            layout: 'full-plane',
            render: 'draw-slope-start',
            interaction: 'select-point',
            behavior: { hoverEffect: 'rise-run' },
            feedback: 'show-rise-run',
        },
    },
} as any); 
