import type { Prompt } from './models';

export interface ScoreResult {
    isCorrect: boolean;
    correctItems?: string[];
    incorrectItems?: string[];
}

export interface FeedbackState {
    type: string | null;
    isCorrect: boolean;
    userResponse: any | null;
    correctResponse: any;
}

export interface QueueState {
    allPrompts: Prompt[];
    unseenReview: Prompt[];
    unseenNew: Prompt[];
    missed: Prompt[];
    queue: Prompt[];
    promptIndex: number;
    seenIds: Set<string>;
    userSkillLevel: number;
    currentSessionLevel: number;
    correctStreak: number;
}
