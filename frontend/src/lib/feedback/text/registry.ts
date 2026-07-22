import type { ResponseFeedbackGenerator } from '@/types';

const generators = new Map<string, ResponseFeedbackGenerator>();

export function getTextFeedback(name: string): ResponseFeedbackGenerator {
    return generators.get(name) || generators.get('default')!;
}

