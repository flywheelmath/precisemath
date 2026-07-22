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
        const { multiplicand1, multiplicand2 } = prompt.data;
        const m1 = Number(multiplicand1);
        const m2 = Number(multiplicand2);

        const learningSequence : number[] = [1, 5, 2, 0, 9, 4, 3, 6, 7, 8];
        const getLearningIndex = (digit: number) => {
            if (digit < 0 || digit > 9) {
                return 10;
            } else {
                return learningSequence.indexOf(digit);
            }
        }

        let eqn1 = '';
        let eqn2 = '';
        let eqn3 = '';

        if (getLearningIndex(m1) < getLearningIndex(m2) && m1*m2 !== 1) {
            switch (m2) {
                case 0:
                    eqn1 = `\\color{aqua} \\boxed{\\mathbf{${m1} \\times 0}} &\\color{aqua}= \\boxed{\\mathbf{0}}`;
                eqn2 = `${m1} \\times 1 &= ${m1}`;
                eqn3 = `${m1} \\times 2 &= ${m1 * 2}`;
                break;
                case 1:
                    eqn1 = `${m1} \\times 0 &= 0`;
                eqn2 = `\\color{aqua} \\boxed{\\mathbf{${m1} \\times 1}} &\\color{aqua}= \\boxed{\\mathbf{${m1}}}`;
                eqn3 = `${m1} \\times 2 &= ${m1 * 2}`;
                break;
                case 8:
                    eqn1 = `\\color{aqua} \\boxed{\\mathbf{${m1} \\times 8}} &\\color{aqua}= \\boxed{\\mathbf{${m1 * 8}}}`;
                eqn2 = `${m1} \\times 9 &= ${m1 * 9}`;
                eqn3 = `${m1} \\times 10 &= ${m1 * 10}`;
                break;
                case 9:
                    eqn1 = `${m1} \\times 8 &= ${m1 * 8}`;
                eqn2 = `\\color{aqua} \\boxed{\\mathbf{${m1} \\times 9}} &\\color{aqua}=  \\boxed{\\mathbf{${m1 * 9}}}`;
                eqn3 = `${m1} \\times 10 &= ${m1 * 10}`;
                break;
                case 10:
                    eqn1 = `${m1} \\times 8 &= ${m1 * 8}`;
                eqn2 = `${m1} \\times 9 &= ${m1 * 9}`;
                eqn3 = `\\color{aqua} \\boxed{\\mathbf{${m1} \\times 10}} &\\color{aqua}= \\boxed{\\mathbf{${m1 * 10}}}`;
                break;
                default:
                    eqn1 = `${m1} \\times ${m2 - 2} &= ${m1 * (m2 - 2)}`;
                eqn2 = `${m1} \\times ${m2 - 1} &= ${m1 * (m2 - 1)}`;
                eqn3 = `\\color{aqua} \\boxed{\\mathbf{${m1} \\times ${m2}}} &\\color{aqua}=  \\boxed{\\mathbf{${m1 * m2}}}`;
                break;
            }
        } else {
            switch (m1) {
                case 0:
                    eqn1 = `\\color{aqua} \\boxed{\\mathbf{0 \\times ${m2}}} &\\color{aqua}= \\boxed{\\mathbf{0}}`;
                eqn2 = `1 \\times ${m2} &= ${m2}`;
                eqn3 = `2 \\times ${m2} &= ${m2 * 2}`;
                break;
                case 1:
                    eqn1 = `0 \\times ${m2} &= 0`;
                eqn2 = `\\color{aqua} \\boxed{\\mathbf{1 \\times ${m2}}} &\\color{aqua}= \\boxed{\\mathbf{${m2}}}`;
                eqn3 = `2 \\times ${m2} &= ${m2 * 2}`;
                break;
                case 8:
                    eqn1 = `\\color{aqua} \\boxed{\\mathbf{8 \\times ${m2}}} &\\color{aqua}= \\boxed{\\mathbf{${m2 * 8}}}`;
                eqn2 = `9 \\times ${m2} &= ${m2 * 9}`;
                eqn3 = `10 \\times ${m2} &= ${m2 * 10}`;
                break;
                case 9:
                    eqn1 = `8 \\times ${m2}&= ${m2 * 8}`;
                eqn2 = `\\color{aqua} \\boxed{\\mathbf{9 \\times ${m2}}} &\\color{aqua}= \\boxed{\\mathbf{${m2 * 9}}}`;
                eqn3 = `10 \\times ${m2} &= ${m2 * 10}`;
                break;
                case 10:
                    eqn1 = `${m1} \\times 8 &= ${m2 * 8}`;
                eqn2 = `${m1} \\times 9 &= ${m2 * 9}`;
                eqn3 = `\\color{aqua} \\boxed{\\mathbf{${m1} \\times 10}} &\\color{aqua}= \\boxed{\\mathbf{${m2 * 10}}}`;
                break;
                default:
                    eqn1 = `${m1 - 2} \\times ${m2} &= ${m2 * (m1 - 2)}`;
                eqn2 = `${m1 - 1} \\times ${m2} &= ${m2 * (m1 - 1)}`;
                eqn3 = `\\color{aqua} \\boxed{\\mathbf{${m1}  \\times ${m2}}} &\\color{aqua}= \\boxed{\\mathbf{${m2 * m1}}}`;
                break;
            }
        }

        return `$$
        \\begin{align*}
        ${eqn1} \\\\
            ${eqn2} \\\\
            ${eqn3} \\\\
            \\end{align*}
        $$`;
    }
}

export default {
    displayName: 'Multiplication',
    sortOrder: 2,
    promptDescriptor,
    responseFeedbackGenerator,
    uiLayout,
    defaultInteractionConfig: 'default',
    durationMode: 'dynamic',
    sessionDurationSeconds: 60,
} as SkillModule;
