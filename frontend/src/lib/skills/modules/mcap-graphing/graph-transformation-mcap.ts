import { defineSkill } from '@/lib/skills/define';
import type { Prompt, SkillModule } from '@/types';

const promptDescriptor = {
    describe(prompt: Prompt): string {
        return prompt.data?.equation ? `y = ${prompt.data.equation}` : 'Transformation';
    }
};

const responseFeedbackGenerator = {
    generateIncorrectResponseFeedback: () => null
};

export default defineSkill({
    displayName: 'MCAP Function Transformations',
    sortOrder: 6,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout: 'MCAPTransformationGraphInput',
    durationMode: 'static',
    sessionDurationSeconds: 60,
    interactionMap: {
        'graph-parabola-mcap': {
            layout: 'full-plane-mcap',
            render: 'draw-parabola',
            interaction: 'two-points', 
            behavior: { hoverEffect: 'point' },
            feedback: 'show-parabola',
            manualFeedback: true,
        }
    },
    defaultInteractionConfig: 'graph-parabola-mcap'
}) as SkillModule;
