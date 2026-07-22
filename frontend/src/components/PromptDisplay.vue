<script setup lang="ts">
import type { PropType } from 'vue';
import type { Prompt } from '@/types';
import { vKatex} from '@/directives/katex';

const props = defineProps({
    prompt: {
        type: Object as PropType<Prompt | null>,
        required: true,
    },
});
</script>

<template>
    <div class="prompt-display">
        <h2 v-if="prompt" :key="prompt.id" v-katex="prompt.prompt_text"></h2>
        <p v-else>No prompt to display.</p>
    </div>
</template>

<style scoped>
.prompt-display {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--color-ui-text-primary);
}
.prompt-display h2 {
    font-size: 1.3rem;
    font-weight: bold;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.2;
    color: var(--color-ui-text-primary);
}
.prompt-display :deep(.katex) {
    color: var(--color-ui-text-primary);
    font-size: 2rem;
}
</style>
