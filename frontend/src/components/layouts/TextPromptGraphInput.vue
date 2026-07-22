<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSessionStore } from '@/stores/session';
import { useInteractionConfig } from '@/composables/useInteractionConfig';
import { useGraphInputState } from '@/composables/useGraphInputState';
import { getCanvasConfig } from '@/lib/graphics/canvasConfigs';

import CoordinatePlane from '@/components/CoordinatePlane.vue';
import PromptDisplay from '@/components/PromptDisplay.vue';
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

const {
    dynamicConfig,
    handlePointClick,
    userPoints,
    reset,
    isInequalityMode,
    isDashed,
    shadingSide,
    derivedShadingPoint,
    setLineStyle,
    setShadingSide,
    isStyleLocked,
} = useGraphInputState(
    computed(() => sessionStore.currentPrompt),
    computed(() => sessionStore.skillLevels),
);

const activeInteractionMode = computed(() => dynamicConfig.value.interaction || interactionMode.value);
const activeRenderMode = computed(() => dynamicConfig.value.render || renderMode.value);
const promptData = computed(() => ({
    ...sessionStore.currentPrompt?.data,
    ...dynamicConfig.value.extraData
}));

const canvasProps = computed(() => { return getCanvasConfig(canvasConfigName.value); });

const showControls = computed(() => {
    return isInequalityMode.value && userPoints.value.length === 2;
});

const canSubmit = computed(() => {
    return isDashed.value !== null && derivedShadingPoint.value !== null;
});

function submitCurrentState() {
    if (isDashed.value !== null && derivedShadingPoint.value !== null) {
        emit('submit', {
            boundaryPoints: userPoints.value,
            isDashed: isDashed.value,
            shadingPoint: derivedShadingPoint.value
        });
    }
}

function handleSubmit() {
    if (canSubmit.value) {
        emit('submit', {
            boundaryPoints: userPoints.value,
            isDashed: isDashed.value,
            shadingPoint: derivedShadingPoint.value
        });
    }
}

function handleSetLineStyle(dashed: boolean) {
    setLineStyle(dashed);
    submitCurrentState();
}

function handleSetShadingSide(side: 'above' | 'below') {
    setShadingSide(side);
    submitCurrentState();
}

function onSubmit(val: any) { emit('submit', val); }
</script>

<template>
    <div v-if="sessionStore.currentPrompt" class="two-column-layout">
        <div class="left-column">
            <PromptDisplay
                :prompt="sessionStore.currentPrompt"
            />
            <SessionClock
                ref="sessionClockRef"
                @time-up="() => sessionStore.handleTimeUp()"
                :is-running="sessionStore.isClockRunning"
            />
            <ScoresDisplay
                :log="sessionStore.sessionLog"
            />
        </div>
        <div class="right-column">
            <CoordinatePlane
                @point-selected="(p) => handlePointClick(p, (val) => emit('submit', val))"
                :feedback-state="sessionStore.feedbackState"
          		:prompt-data="promptData"
                :render-mode="activeRenderMode"
                :interaction-mode="activeInteractionMode"
                v-bind="canvasProps"
            />
            
            <div class="controls-wrapper">
                <div class="graph-controls">
                    <div v-if="showControls" class="control-group">
                        <button
                            class="toggle-btn"
                            :class="{ active: isDashed === false }"
                            @click="setLineStyle(false)"
                            :disabled="sessionStore.isSubmitting"
                        >
                            Solid line
                        </button>
                        <button
                            class="toggle-btn"
                            :class="{ active: isDashed === true }"
                            @click="setLineStyle(true)"
                            :disabled="sessionStore.isSubmitting"
                        >
                            Dashed line
                        </button>
                    </div>

                    <div v-if="showControls" class="control-group">
                        <button
                            class="toggle-btn"
                            :class="{ active: shadingSide === 'above' }"
                            @click="setShadingSide('above')"
                            :disabled="sessionStore.isSubmitting"
                        >
                        Shade above
                        </button>
                        <button
                            class="toggle-btn"
                            :class="{ active: shadingSide === 'below' }"
                            @click="setShadingSide('below')"
                            :disabled="sessionStore.isSubmitting"
                        >
                        Shade below
                        </button>
                    </div>

                    <div v-if="showControls" class="action-group">
                        <button
                            class="btn-clear"
                            @click="reset"
                        >
                        Clear
                        </button>
                        <button
                            class="btn-submit"
                            :disabled="!canSubmit"
                            @click="handleSubmit"
                        >
                        Submit
                        </button>
                    </div>

                    <div v-if="!showControls && userPoints.length > 0" class="action-group">
                        <button
                            class="btn-clear"
                            @click="reset"
                        >
                        Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.two-column-layout {
    display: grid;
    grid-template-columns: minmax(300px, 1fr) auto;
    gap: 1.5rem;
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
    gap: .5rem;
    justify-content: flex-start;
}
.right-column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 100%;
    width: 420px;
}
.controls-wrapper {
    width: 100%;
    min-height: auto;
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
}
.graph-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: auto;
    min-height: 60px;
    padding: 10px;
    background: var(--color-ui-surface-soft);
    border-radius: 8px;
    border: 1px solid var(--color-ui-border);
}
.control-group {
    display: flex;
    gap: 0.5rem;
}
.action-group {
    display: flex;
    gap: 5px;
    margin-left: auto;
}
.toggle-btn {
    padding: 8px 12px;
    border: 1px solid var(--color-ui-primary);
    background: transparent;
    color: var(--color-ui-primary);
    cursor: pointer;
    border-radius: 4px;
    font-size: 1rem;
    transition: all 0.2s;
}
.toggle-btn.active {
    background: var(--color-ui-primary);
    color: white;
}
.btn-clear {
    margin-left: auto;
    padding: 6px 16px;
    background: var(--color-ui-danger-bg);
    color: var(--color-ui-danger);
    border: 1px solid var(--color-ui-danger);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-clear:hover {
    background: var(--color-ui-danger);
    color: white;
}
.btn-submit {
    padding: 8px 20px;
    background: var(--color-graph-correct);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s;
}
.btn-submit:disabled {
    background: var(--color-ui-text-secondary);
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none;
}
.btn-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
}
</style>
