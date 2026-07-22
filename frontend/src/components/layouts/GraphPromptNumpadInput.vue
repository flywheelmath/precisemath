<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSessionStore } from '@/stores/session';
import { useInteractionConfig } from '@/composables/useInteractionConfig';
import { getCanvasConfig } from '@/lib/graphics/canvasConfigs';

import CoordinatePlane from '@/components/CoordinatePlane.vue';
import PromptDisplay from '@/components/PromptDisplay.vue';
import UserInput from '@/components/UserInput.vue';
import SessionClock from '@/components/SessionClock.vue';
import ScoresDisplay from '@/components/ScoresDisplay.vue';

const emit = defineEmits(['submit']);
const sessionStore = useSessionStore();
const { interactionMode, renderMode, canvasConfigName } = useInteractionConfig(
    computed(() => sessionStore.categorySlug),
    computed(() => sessionStore.skillSlug),
    computed(() => sessionStore.currentPrompt),
    computed(() => sessionStore.skillLevels),
);

const promptData = computed(() => sessionStore.currentPrompt?.data || {});
const canvasProps = computed(() => { return getCanvasConfig(canvasConfigName.value); });

async function onSubmit(val: any) {
    emit('submit', val);
}
</script>

<template>
    <div v-if="sessionStore.currentPrompt" class="two-column-layout">
        <div class="left-column">
            <CoordinatePlane
                :feedback-state="sessionStore.feedbackState"
                :prompt-data="promptData"
                :render-mode="renderMode"
                :interaction-mode="interactionMode"
                v-bind="canvasProps"
            />
            <ScoresDisplay
                :log="sessionStore.sessionLog"
            />
        </div>
        <div class="right-column">
            <PromptDisplay
                :prompt="sessionStore.currentPrompt"
            />
            <UserInput
                @submit="onSubmit"
                :disabled="!sessionStore.sessionStarted"
            />
            <SessionClock
                ref="sessionClockRef"
                @time-up="() => sessionStore.handleTimeUp()"
                :is-running="sessionStore.isClockRunning"
            />
        </div>
    </div>
</template>
<style scoped>
.two-column-layout {
    display: grid;
    grid-template-columns: minmax(300px, 1fr) auto;
    gap: 0.5rem;
    height: 90vh;
    max-height: 620px;
    align-items: start;
    justify-content: center;
}
.left-column {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    padding-right: 10px;
    gap: 0.5rem;
    justify-content: flex-start;
}
.right-column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 100%;
    width: 420px;
}
</style>
