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
        const { summand1, summand2 } = prompt.data;
        const num1 = Number(summand1);
        const num2 = Number(summand2);

        const constant = Math.max(num1, num2);
        const variable = Math.min(num1, num2);

        let sequence: number[];

        if (variable === 0) {
            sequence = [0, 1, 2];
        } else if (variable === 1) {
            sequence = [0, 1, 2];
        } else {
            sequence = [variable - 2, variable - 1, variable];
        }

        const equations = sequence.map(val => {
            const leftSide = (num1 === constant) ? `${constant} + ${val}` : `${val} + ${constant}`;
            const rightSide = constant + val;

            let equation = `${leftSide} &= ${rightSide}`;

            if (val === variable) {
                equation = `\\color{aqua} \\boxed{\\mathbf{${leftSide}}} &\\color{aqua}= \\boxed{\\mathbf{${rightSide}}}`;
            }
            return equation;
        });

        return `$$
        \\begin{align*}
        ${equations.join(' \\\\ \n')}
        \\end{align*}
        $$`;
    }
};

export default {
    displayName: 'Addition',
    sortOrder: 1,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout,
    defaultInteractionConfig: 'default',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
} as SkillModule
