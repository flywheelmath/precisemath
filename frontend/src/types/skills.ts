import type { Prompt } from './models';

export interface ResponseFeedbackGenerator {
    generateIncorrectResponseFeedback(prompt: Prompt, userResponse: string): string | null;
}

export interface SkillModule {
    displayName: string;
    sortOrder: number;
    promptDescriptor: { describe: (prompt: Prompt) => string; }; 
    responseFeedbackGenerator: ResponseFeedbackGenerator;
    uiLayout: string;
    interactionMap?: Record<string, any>;
    defaultInteractionConfig?: string;
}
