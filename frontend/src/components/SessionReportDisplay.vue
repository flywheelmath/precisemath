<script setup lang="ts">
import type { PropType } from 'vue';
import type { SessionReport } from '@/types';
import { vKatex } from '@/directives/katex';

defineProps({
    report: {
        type: Object as PropType<SessionReport>,
        required: true,
    },
});

function formatPercent(rate: number): string {
    return `${Math.round(rate * 100)}%`;
}

const emit = defineEmits(['try-again']);
</script>

<template>
    <div class="report-container">
        <h2 class="report-title">Session report</h2>

        <div class="summary-stats">
            <div class="stat-item">
                <span class="stat-value text-green-500">{{ report.total_correct }}</span>
                <span class="stat-label">Correct<span style="color: #2ecc71;">&#x2713;</span></span>
            </div>
            <div class="stat-item">
                <span class="stat-value text-red-500">{{ report.total_incorrect }}</span>
                <span class="stat-label">Incorrect<span style="color: #e74c3c;">&#x274C;</span></span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ report.correct_per_minute }}</span>
                <span class="stat-label">Correct/Min &#9201;</span>
            </div>
        </div>

        <div class="performance-lists">
            <div class="prompt-list-container">
                <h3 class="list-title">Most accurate</h3>
                <ul v-if="report.most_accurate_prompts.length" class="prompt-list">
                    <li v-for="prompt in report.most_accurate_prompts" :key="prompt.prompt_id" class="prompt-item">
                        <span class="prompt-id" v-katex="prompt.display_text"></span>
                        <div class="prompt-details">
                            <span class="success-rate text-green-500">{{ formatPercent(prompt.success_rate) }}</span>
                            <span class="prompt-counts">({{ prompt.correct }}/{{ prompt.total_responses }})</span>
                        </div>
                    </li>
                </ul>
                <p v-else class="no-data">Not enough data.</p>
            </div>

            <div class="prompt-list-container">
                <h3 class="list-title">Least accurate</h3>
                <ul v-if="report.least_accurate_prompts.length" class="prompt-list">
                    <li v-for="prompt in report.least_accurate_prompts" :key="prompt.prompt_id" class="prompt-item">
                        <span class="prompt-id" v-katex="prompt.display_text"></span>
                        <div class="prompt-details">
                            <span class="success-rate text-red-500">{{ formatPercent(prompt.success_rate) }}</span>
                            <span class="prompt-counts">({{ prompt.correct }}/{{ prompt.total_responses }})</span>
                        </div>
                    </li>
                </ul>
                <p v-else class="no-data">Not enough data.</p>
            </div>
        </div>

        <div class="actions-footer">
            <button @click="emit('try-again')" class="try-again-button">Try again</button>
        </div>
    </div>
</template>

<style scoped>
.report-container {
    background-color: var(--color-ui-surface);
    color: var(--color-ui-text-primary);
    padding: 2rem;
    width: 700px;
    border: 1px solid var(--color-ui-border);
    border-radius: 12px;
    box-shadow: 0 10px 25px var(--color-ui-shadow);
}

.report-title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--color-ui-primary);
}

.summary-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 2rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 3rem;
    font-weight: bold;
}

.stat-label {
    font-size: 1rem;
    color: var(--color-ui-text-secondary);
    text-transform: uppercase;
}

.performance-lists {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.prompt-list-container {
    background-color: var(--color-ui-surface-soft);
    padding: 1.5rem;
    border-radius: 8px;
}

.list-title {
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    color: var(--color-ui-text-primary);
}

.prompt-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.prompt-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-ui-border);
}

.prompt-item:last-child {
    border-bottom: none;
}

.prompt-id {
    font-family: monospace;
    color: var(--color-ui-text-secondary);
}

.prompt-details {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.success-rate {
    font-size: 1.25rem;
    font-weight: bold;
}

.prompt-counts {
    font-size: 0.9rem;
    color: var(--color-ui-text-secondary);
}

.no-data {
    text-align: center;
    color: var(--color-ui-text-secondary);
    padding: 1rem 0;
}

.text-green-500 {
    color: var(--color-ui-success);
}

.text-red-500 {
    color: var(--color-ui-danger);
}

.actions-footer {
    text-align: center;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
}

.try-again-button {
    font-size: 1.5rem;
    padding: 15px 40px;
    cursor: pointer;
    border-radius: 8px;
    background-color: var(--color-ui-primary);
    color: white;
    border: none;
}
</style>
