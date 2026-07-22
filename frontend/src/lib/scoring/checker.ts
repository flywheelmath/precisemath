import { checkResponse } from './validators';
import type { Prompt, UserResponse, ScoreResult } from '@/types';

export const scorePrompt = (prompt: Prompt, userResponse: UserResponse): ScoreResult => {
    if (!prompt.correct_response) {
        console.error(`Prompt ${prompt.id} missing correct_response field`);
        return { isCorrect: false };
    }
    return checkResponse(prompt.correct_response, userResponse);
};
