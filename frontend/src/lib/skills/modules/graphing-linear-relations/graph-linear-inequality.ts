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
    render: 'draw-inequality',
    behavior: { hoverEffect: 'point' },
    feedback: 'show-inequality-region',
};


export default defineSkill({
    displayName: 'Linear inequalities',
    sortOrder: 3,
    promptDescriptor,
    responseFeedbackGenerator: defaultResponseFeedbackGenerator,
    uiLayout: 'TextPromptGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 60,
    interactionMap: {
        'select-interior': commonConfig,
        'select-boundary-type-then-interior': commonConfig,
        'select-boundary-then-interior': commonConfig
    },
    defaultInteractionConfig: 'select-boundary-then-interior'
}) as SkillModule; 
