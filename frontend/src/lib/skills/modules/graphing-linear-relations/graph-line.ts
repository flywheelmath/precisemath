import { defineSkill } from '@/lib/skills/define';
import type { Prompt, ResponseFeedbackGenerator, SkillModule } from '@/types';

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

const commonConfig = {
    layout: 'full-plane',
    render: 'draw-point',
    interaction: 'select-point',
    behavior: { hoverEffect: 'show-rise-run' },
    feedback: 'show-rise-run-line',
};

export default defineSkill({
    displayName: 'Lines',
    sortOrder: 2,
    promptDescriptor,
    responseFeedbackGenerator: defaultResponseFeedbackGenerator,
    uiLayout: 'TextPromptGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 60,
    interactionMap: {
        'select-two-points': {
            ...commonConfig,
        },
    },
    defaultInteractionConfig: 'select-two-points'
}) as SkillModule; 
