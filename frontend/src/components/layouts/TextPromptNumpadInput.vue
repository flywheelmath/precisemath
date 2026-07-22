<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSessionStore } from '@/stores/session';
import { useInteractionConfig } from '@/composables/useInteractionConfig';

import CoordinatePlane from '@/components/CoordinatePlane.vue';
import PromptDisplay from '@/components/PromptDisplay.vue';
import UserInput from '@/components/UserInput.vue';
import SessionClock from '@/components/SessionClock.vue';
import ScoresDisplay from '@/components/ScoresDisplay.vue';

const emit = defineEmits(['submit']);
const sessionStore = useSessionStore();
const sessionClockRef = ref<InstanceType<typeof SessionClock> | null>(null);

const { interactionMode, renderMode, canvasConfigName } = useInteractionConfig(
    computed(() => sessionStore.categorySlug),
    computed(() => sessionStore.skillSlug),
    computed(() => sessionStore.currentPrompt),
    computed(() => sessionStore.skillLevels),
);

function onSubmit(val: any) { emit('submit', val); }
</script>
<template>
    <div v-if="sessionStore.sessionLog" class="two-column-layout">
        <div class="left-column">
            <SessionClock 
                 ref="sessionClockRef"
                 @time-up="() => sessionStore.handleTimeUp()"
                 :is-running="sessionStore.isClockRunning"
             />
             <ScoresDisplay :log="sessionStore.sessionLog" />
        </div>
        <div class="right-column">
            <PromptDisplay
                :prompt="sessionStore.currentPrompt"
            />
            <UserInput
                @submit="onSubmit"
                :disabled="!sessionStore.sessionStarted"
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
    overflow: auto;
    justify-content: flex-start;
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
