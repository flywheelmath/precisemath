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
        const { minuend, subtrahend } = prompt.data;
        const num1 = Number(minuend);
        const num2 = Number(subtrahend);

        const leftSide = `${prompt.data.minuend} - ${prompt.data.subtrahend}`;
        const rightSide = num1 - num2;

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
    displayName: 'Subtraction',
    sortOrder: 3,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout,
    defaultInteractionConfig: 'default',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
} as SkillModule
