import type { 
    SessionLog, 
    SessionReport,
    Prompt,
    PromptPerformance
} from '@/types';

function getPromptDescription(prompt: Prompt | undefined, id: string): string {
    if (prompt?.prompt_text) return prompt.prompt_text;
    return `...${id.slice(-6)}`;
}

export function analyzeSession(
    log: SessionLog,
    allPrompts: Prompt[],
    count = 3
): SessionReport {
    const totalDurationMs = log.history.reduce((sum, r) => sum + r.time_spent_ms, 0);
    const totalDurationMin = totalDurationMs / 60000;
    const cpm = totalDurationMin > 0 ? (log.score.correct / totalDurationMin) : 0;

    const promptStats = new Map<string, { correct: number; incorrect: number }>();
    const promptLookup = new Map(allPrompts.map(p => [p.id, p]));

    for (const response of log.history) {
        const current = promptStats.get(response.prompt_id) || { correct: 0, incorrect: 0 };
        if (response.was_correct) current.correct++;
        else current.incorrect++;
        promptStats.set(response.prompt_id, current);
    }

    const performances: PromptPerformance[] = [];

    promptStats.forEach((stats, id) => {
        const total = stats.correct + stats.incorrect;
        const prompt = promptLookup.get(id);

        performances.push({
            prompt_id: id,
            display_text: getPromptDescription(prompt, id),
            correct: stats.correct,
            incorrect: stats.incorrect,
            total_responses: total,
            success_rate: total > 0 ? (stats.correct / total) : 0
        });
    });

    performances.sort((a, b) => {
        if (a.success_rate !== b.success_rate) return b.success_rate - a.success_rate;
        return b.total_responses - a.total_responses;
    });

    return {
        total_correct: log.score.correct,
        total_incorrect: log.score.incorrect,
        correct_per_minute: parseFloat(cpm.toFixed(1)),
        most_accurate_prompts: performances.slice(0, count),
        least_accurate_prompts: performances.slice().reverse().slice(0, count),
    };
}
