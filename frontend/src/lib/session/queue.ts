import type { Prompt, QueueState, SkillLevelData } from '@/types';

const QUEUE_LENGTH = 3;

function shuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
}

function getRandom<T>(arr: T[]): T | undefined {
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
}

export function initQueue(
    prompts: Prompt[],
    userRank: number,
): QueueState {
    const unseenReview = prompts.filter(p => (p.skill_level_rank ?? 0) < userRank);
    const unseenNew = prompts.filter(p => (p.skill_level_rank ?? 0) >= userRank);
    const queue: Prompt[] = [];
    const firstNew = getRandom(unseenNew);
    if (firstNew) { queue.push(firstNew); }

    const secondNew = getRandom(unseenNew);
    if (secondNew) { queue.push(secondNew); }

    while (queue.length < QUEUE_LENGTH) {
        const candidate = getRandom(unseenReview) || getRandom(prompts);

        if (candidate && !queue.some(p => p.id === candidate.id)) {
            queue.push(candidate);
        } else if (!candidate) {
            break;
        }
    }

    const shuffledQueue = shuffle(queue);
    const seenIds = new Set(queue.map(p => p.id));

    return {
        allPrompts: shuffle(prompts),
        unseenReview: shuffle(unseenReview),
        unseenNew: shuffle(unseenNew),
        missed: [],
        queue: shuffledQueue,
        promptIndex: 0,
        seenIds,
        userSkillLevel: userRank,
        currentSessionLevel: userRank,
        correctStreak: 0
    };
}

export function updateQueue(
    state: QueueState,
    wasCorrect: boolean,
): { nextPrompt: Prompt | null, newState: QueueState } {
    const newState: QueueState = {
        ...state,
        seenIds: new Set(state.seenIds),
        missed: [...state.missed],
        queue: [...state.queue],
        unseenReview: [...state.unseenReview],
        unseenNew: [...state.unseenNew],
    };

    const currentPrompt = state.queue[state.promptIndex];

    if (wasCorrect) {
        newState.correctStreak++;
        if (newState.correctStreak >= 2) {
            const maxLevel = Math.max(...state.allPrompts.map(p => (p.skill_level_rank ?? 0)));
            newState.currentSessionLevel = Math.min(newState.currentSessionLevel + 1, maxLevel);
            newState.correctStreak = 0;
        }
    } else {
        newState.correctStreak = 0;
        newState.currentSessionLevel = Math.max(state.userSkillLevel, newState.currentSessionLevel - 1);
        if (currentPrompt && !newState.missed.some(p => p.id === currentPrompt.id)) {
            newState.missed.push(currentPrompt);
        }
    }

    if (state.promptIndex < newState.queue.length - 1) {
        newState.promptIndex++;
    } else {
        newState.queue.pop();
        let next: Prompt | undefined;
        const isInQueue = (p: Prompt) => newState.queue.some(c => c.id === p.id);
        const missedCandidates = newState.missed.filter(m => !isInQueue(m));
        if (missedCandidates.length > 0) {
            next = getRandom(missedCandidates);
            newState.missed = newState.missed.filter(p => p.id !== next?.id);
        }

        if (!next && Math.random() < 0.4) {
            const reviews = newState.unseenReview.filter(p => !isInQueue(p));
            next = getRandom(reviews);
        }

        if (!next) {
            const adaptiveNew = newState.allPrompts.filter(p => (p.skill_level_rank ?? 0) === newState.currentSessionLevel && !isInQueue(p));
            next = getRandom(adaptiveNew);
        }

        if (!next) {
            next = getRandom(newState.allPrompts.filter(p => !isInQueue(p)));
        }

        if (next) {
            newState.queue.unshift(next);
            newState.seenIds.add(next.id);
        }
        newState.promptIndex = 0;
    }

    const nextPrompt = newState.queue[newState.promptIndex] || null;
    return { nextPrompt, newState };
}
