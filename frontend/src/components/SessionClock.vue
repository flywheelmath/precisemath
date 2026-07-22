<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useSessionStore } from '@/stores/session';

const props = defineProps({
    isRunning: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['time-up']);
const sessionStore = useSessionStore();

const timeRemaining = ref(sessionStore.sessionDurationSeconds);
const timerInterval = ref<number | null>(null);

function updateTime() {
    if (!sessionStore.sessionStartTime) return;

    const now = Date.now();
    const elapsed = (now - sessionStore.sessionStartTime) / 1000;
    const remaining = Math.max(0, sessionStore.sessionDurationSeconds - elapsed);

    timeRemaining.value = remaining;

    if (remaining <= 0) {
        emit('time-up');
        stopTimer();
    }
}

function startTimer() {
    if (timerInterval.value) return;
    updateTime();
    timerInterval.value = window.setInterval(updateTime, 100);
}

function stopTimer() {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
}

watch(() => props.isRunning, (newVal) => {
    if (newVal) startTimer();
    else stopTimer();
}, { immediate: true });

onMounted(() => {
    if (props.isRunning) startTimer();
});

onUnmounted(() => {
    stopTimer();
});

const formattedTime = computed(() => {
    const totalSeconds = Math.ceil(timeRemaining.value);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
});

const progress = computed(() => {
    return (timeRemaining.value / sessionStore.sessionDurationSeconds) * 100;
});
</script>

<template>
    <div class="clock-container">
        <div class="time-text" :class="{ 'time-low': timeRemaining < 10 }">
            {{ formattedTime }}
        </div>
        <div class="progress-bar-bg">
            <div
                class="progress-bar-fill"
                :style="{ width: `${progress}%` }"
                :class="{ 'fill-low': timeRemaining < 10 }"
            ></div>
        </div>
    </div>
</template>

<style scoped>
.clock-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 10px;
    background: var(--color-ui-surface);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.time-text {
    font-size: 2.5rem;
    color: var(--color-ui-text-primary);
    margin-bottom: 5px;
    font-variant-numeric: tabular-nums;
}
.time-low {
    color: var(--color-ui-danger);
    animation: pulse 1s infinite;
}
.progress-bar-bg {
    width: 100%;
    height: 8px;
    background-color: var(--color-ui-border);
    border-radius: 4px;
    overflow: hidden;
}
.progress-bar-fill {
    height: 100%;
    background-color: var(--color-ui-primary);
    transition: width 0.1s linear;
}
.fill-low {
    background-color: var(--color-ui-danger);
}
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
</style>
