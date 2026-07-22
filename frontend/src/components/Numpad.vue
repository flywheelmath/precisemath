<script setup lang="ts">
const emit = defineEmits<{
    (e: 'digit', value: string): void;
    (e: 'backspace'): void;
    (e: 'submit'): void;
    (e: 'negative'): void;
}>();

const buttons = [
    'submit',
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'backspace', '0', 'negative'
];

function handleButtonClick(value: string) {
    switch (value) {
        case 'submit':
            emit('submit');
            break;
        case 'backspace':
            emit('backspace');
            break;
        case 'negative':
            emit('negative');
            break;
        default:
            emit('digit', value);
        break;
  }
}
</script>

<template>
    <div class="numpad-grid">
        <button
            v-for="btn in buttons"
            :key="btn"
            @click="handleButtonClick(btn)"
            :class="['numpad-button', `numpad-button--${btn}`]"
        >
            <span v-if="btn === 'backspace'">&larr;</span>
            <span v-else-if="btn === 'submit'">&check;</span>
            <span v-else-if="btn === 'negative'">+/-</span>
            <span v-else>{{ btn }}</span>
        </button>
    </div>
</template>

<style scoped>
.numpad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
    max-width: 250px;
    margin: 20px auto;
}
.numpad-button {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-ui-button-text);
    background-color: var(--color-ui-button-bg);
    border: none;
    border-radius: 8px;
    height: 50px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 4px 6px var(--color-ui-shadow);
}
.numpad-button:hover {
    background-color: var(--color-ui-button-hover);
}
.numpad-button:active {
    transform: translateY(2px);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}
.numpad-button--backspace {
    background-color: var(--color-ui-danger);
    color: white;
}
.numpad-button--backspace:hover {
    background-color: var(--color-ui-danger-hover);
}
.numpad-button--submit {
    grid-column: 1 / -1;
    background-color: var(--color-ui-success);
    color: white;
}
.numpad-button--submit:hover {
    filter: brightness(0.9);
}
</style>

