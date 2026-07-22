// src/lib/session/duration.ts

interface DurationConfig {
    durationMode?: 'static' | 'dynamic';
    sessionDurationSeconds?: number;
}

export function computeSessionDuration(
    config: DurationConfig | undefined,
    playerSkillLevel: number | null,
): number {
    const durationMode = config?.durationMode || 'static';
    const durationMax = config?.sessionDurationSeconds ?? 60;

    const level = playerSkillLevel || 99;

    if (durationMode === 'dynamic') {
        return Math.min(durationMax, 30 + 5 * Math.max(level - 4, 0));
    }

    return durationMax;
}
