import type { Prompt, SkillModule } from '@/types';

const uiLayout = 'TextPromptNumpadInput';

const promptDescriptor = {
    describe(prompt: Prompt): string {
        if (prompt.prompt_text !== undefined) {
            return prompt.prompt_text;
        }
        return `...${prompt.id.slice(-6)}`;
    }
};

const responseFeedbackGenerator = {
    generateIncorrectResponseFeedback(prompt: Prompt, userResponse: string): string {
        const { dividend, divisor } = prompt.data;
        const num1 = Number(dividend);
        const num2 = Number(divisor);

        const leftSide = `${prompt.data.dividend} \\div ${prompt.data.divisor}`;
        const rightSide = num1 / num2;

        let equation = `${leftSide} &= ${rightSide}`;

        equation = `\\color{aqua} \\boxed{\\mathbf{${leftSide}}} &\\color{aqua}= \\boxed{\\mathbf{${rightSide}}}`;

        return `$$
        \\begin{align*}
        ${equation}
        \\end{align*}
        $$`;
    }
};

export default {
    displayName: 'Division',
    sortOrder: 4,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout,
    defaultInteractionConfig: 'default',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
} as SkillModule
