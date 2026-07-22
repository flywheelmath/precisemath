<script setup lang="ts">
import type { PropType } from 'vue';
import type { SessionLog } from '@/types';

const props = defineProps({
    log: {
        type: Object as PropType<SessionLog | null>,
        required: true,
    },
});
</script>

<template>
    <div v-if="log" class="scores-display">
        <div class="score-item score-correct">
            <span class="score-label">Correct</span>
            <span class="score-value">{{ log.score.correct }}</span>
        </div>
        <div class="score-item score-incorrect">
            <span class="score-label">Incorrect</span>
            <span class="score-value">{{ log.score.incorrect }}</span>
        </div>
    </div>
</template>

<style scoped>
.scores-display {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
}
.score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2px 8px;
    border-radius: 8px;
    background-color: var(--color-ui-surface-soft);
    border: 1px solid var(--color-ui-border);
    width: 100px;
}
.score-label {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-ui-text-secondary);
}
.score-value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-ui-text-primary);
}
.score-correct .score-value {
    color: var(--color-ui-success);
}
.score-incorrect .score-value {
    color: var(--color-ui-danger);
}
</style>
