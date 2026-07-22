import { defineSkill } from '@/lib/skills/define';
import type { Prompt, SkillModule } from '@/types';

const promptDescriptor = {
    describe(prompt: Prompt): string {
        return prompt.prompt_text !== undefined ? prompt.prompt_text : `...${prompt.id.slice(-6)}`;
    }
};

const responseFeedbackGenerator = {
    generateIncorrectResponseFeedback: () => null
};

export default defineSkill({
    displayName: 'MCAP Lines',
    sortOrder: 1,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout: 'MCAPLineGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 120,
    interactionMap: {
        'graph-line-mcap-default': {
            layout: 'full-plane-mcap',
            render: 'draw-user-line',
            behavior: { hoverEffect: 'line-mcap' },
            feedback: 'show-rise-run-line',
            manualFeedback: true,
        }
    },
    defaultInteractionConfig: 'graph-line-mcap-default'
}) as SkillModule;
