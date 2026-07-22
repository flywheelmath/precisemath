<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useSessionStore } from '@/stores/session';
import Numpad from './Numpad.vue';

const props = defineProps({
    disabled: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['submit']);

const sessionStore = useSessionStore();
const userResponse = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(userResponse, (newVal) => {
    sessionStore.updateResponse(newVal);
});

function handleSubmit() {
    if (!userResponse.value || props.disabled) { return; }
    emit('submit', userResponse.value);
    userResponse.value = '';
}

function handleDigit(value: string) {
    if (props.disabled) return;
    userResponse.value += value;
    inputRef.value?.focus();
}

function handleBackspace() {
    if (props.disabled) return;
    userResponse.value = userResponse.value.slice(0, -1);
    inputRef.value?.focus();
}

function handleNegative() {
    if (props.disabled) return;
    if (userResponse.value.startsWith('-')) {
      userResponse.value = userResponse.value.substring(1);
    } else {
      userResponse.value = '-' + userResponse.value;
    }
    inputRef.value?.focus();
}

onMounted(() => {
    inputRef.value?.focus();
});

watch(() => props.disabled, (isDisabled) => {
    if (!isDisabled) {
        nextTick(() => {
            inputRef.value?.focus();
        });
    }
});
</script>

<template>
    <div>
        <form class="user-input-form" @submit.prevent="handleSubmit">
            <input
                ref="inputRef"
                v-model="userResponse"
                type="text"
                :disabled="disabled"
                class="response-input"
                autocomplete="off"
                inputmode="numeric"
            />
        </form>
        <Numpad
            @digit="handleDigit"
            @backspace="handleBackspace"
            @submit="handleSubmit"
            @negative="handleNegative"
        />
    </div>
</template>

<style scoped>
.user-input-form {
    display: flex;
    justify-content: center;
    margin: 20px 0;
}
.response-input {
    font-size: 2rem;
    padding: 10px;
    width: 100px;
    text-align: center;
    background-color: var(--color-ui-input-bg);
    color: var(--color-ui-text-primary);
    border: 2px solid var(--color-ui-border);
    border-radius: 8px;
    margin-left: 10px;
    margin-right: 10px;
}
.response-input:focus {
    outline: none;
    border-color: var(--color-ui-primary);
}
</style>
