<script setup lang="ts">
    import {vKatex } from '@/directives/katex';

defineProps({
    message: {
        type: String,
        required: true,
    },
    mode: {
        type: String,
        default: 'default',
    }
});
</script>

<template>
    <div class="feedback-container overlay-mode feedback-incorrect">
        <p v-katex="message"></p>
    </div>
</template>

<style scoped>
.feedback-container {
    margin: 20px auto;
    padding: 15px;
    border-radius: 8px;
    max-width: 300px;
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
}
.feedback-incorrect {
    background-color: var(--color-ui-danger);
}
.overlay-mode {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 100%;
    min-height: 10%;
    z-index: 10;
    font-size: 2.5rem;
}
.overlay-mode.feedback-incorrect {
    background-color: var(--color-ui-danger);
}
.feedback-container :deep(.katex) {
    font-size: 2.5rem;
}
</style>
