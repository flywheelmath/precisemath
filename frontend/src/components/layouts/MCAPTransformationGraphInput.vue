<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSessionStore } from '@/stores/session';
import { useInteractionConfig } from '@/composables/useInteractionConfig';
import { getCanvasConfig } from '@/lib/graphics/canvasConfigs';

import type { Point } from '@/types';

import CoordinatePlane from '@/components/MCAPCoordinatePlane.vue';
import PromptDisplay from '@/components/PromptDisplay.vue';
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

const canvasProps = computed(() => getCanvasConfig(canvasConfigName.value));

const promptData = computed(() => ({
    ...sessionStore.currentPrompt?.data,
    points: interactionPoints.value,
    activePointId: draggedPointId.value
}));

const draggedPointId = ref<string | null>(null);
const originalPointPos = ref<[number, number] | null>(null);

const interactionPoints = computed(() => {
  if (sessionStore.currentResponse?.points) {
    return sessionStore.currentResponse.points;
  }

  const parent = sessionStore.currentPrompt?.data?.parent;
  if (parent) {
    return [
      { x: parent.h, y: parent.k, id: 'vertex' },
      { x: parent.secondary_point?.x ?? (parent.h + 1), y: parent.secondary_point?.y ?? (parent.k + parent.a), id: 'curve' }
    ];
  }

  return [
    { x: 0, y: 0, id: 'vertex' },
    { x: 1, y: 1, id: 'curve' }
  ];
});

function handleDrag(coords: [number, number], phase: 'start' | 'move' | 'end' | 'click') {
    const [x, y] = coords;
    const current = [...interactionPoints.value];

    if (phase === 'click') {
        if (draggedPointId.value) { handleDrag(coords, 'end'); } 
        else { handleDrag(coords, 'start'); }
        return;
    }

    if (phase === 'start') {
        const point = current.find((p: Point) => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
        if (point) {
            draggedPointId.value = point.id;
            originalPointPos.value = [x, y];
        }
        return;
    }

    if (!draggedPointId.value || !originalPointPos.value) return;

    const idx = current.findIndex(p => p.id === draggedPointId.value);
    const otherIdx = idx === 0 ? 1 : 0;

    if (phase === 'end') {
        if (x === current[otherIdx].x && y === current[otherIdx].y) {
            current[idx] = { ...current[idx], x: originalPointPos.value[0], y: originalPointPos.value[1] };
        } else {
            current[idx] = { ...current[idx], x, y };
        }
        sessionStore.updateResponse({ points: current });
        draggedPointId.value = null;
        originalPointPos.value = null;
    } else {
        current[idx] = { ...current[idx], x, y };
        sessionStore.updateResponse({ points: current });
    }
}

function handleReset() {
    draggedPointId.value = null;
    sessionStore.updateResponse({ points: null });
}

function handleSubmit() {
    const vertex = interactionPoints.value.find((p: Point) => p.id === 'vertex');
    const curve = interactionPoints.value.find((p: Point) => p.id === 'curve');
    
    if (vertex && curve) {
        emit('submit', [ 
            [vertex.x, vertex.y],
            [curve.x, curve.y]
        ]);
    }
}

watch(() => sessionStore.currentPrompt, () => {
    handleReset();
});
</script>

<template>
    <div v-if="sessionStore.currentPrompt" class="two-column-layout">
        <div class="left-column">
            <PromptDisplay :prompt="sessionStore.currentPrompt" />
            <SessionClock
                @time-up="() => sessionStore.handleTimeUp()"
                :is-running="sessionStore.isClockRunning"
            />
            <ScoresDisplay :log="sessionStore.sessionLog" />
        </div>
        <div class="right-column">
            <CoordinatePlane
                @drag-start="(p) => handleDrag(p, 'start')"
                @drag-move="(p) => handleDrag(p, 'move')"
                @drag-end="(p) => handleDrag(p, 'end')"
                @point-selected="(p) => handleDrag(p, 'click')"
                :feedback-state="sessionStore.feedbackState"
                :prompt-data="promptData"
                :render-mode="renderMode"
                :interaction-mode="interactionMode"
                v-bind="canvasProps"
            />
            <div class="controls-wrapper">
                <div class="graph-controls">
                    <div class="action-group">
                        <template v-if="!sessionStore.isShowingFeedback">
                            <button class="btn-clear" @click="handleReset">Reset</button>
                            <button class="btn-submit" @click="handleSubmit">Submit</button>
                        </template>
                        <template v-else>
                            <button 
                                class="btn-submit" 
                                @click="sessionStore.dismissFeedback"
                                :disabled="sessionStore.isFeedbackLocked"
                            >
                                Try another
                            </button>
                        </template>
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
.controls-wrapper { margin-top: 1rem; }
.graph-controls { padding: 10px; background: var(--color-ui-surface-soft); border-radius: 8px; border: 1px solid var(--color-ui-border); }
.action-group { display: flex; gap: 5px; margin-left: auto; justify-content: flex-end;}
.btn-clear { padding: 6px 16px; background: var(--color-ui-danger-bg); color: var(--color-ui-danger); border: 1px solid var(--color-ui-danger); border-radius: 4px; cursor: pointer; }
.btn-submit { padding: 8px 20px; background: var(--color-graph-correct); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-submit:disabled { background: var(--color-ui-text-secondary); cursor: not-allowed; opacity: 0.5; box-shadow: none; }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.15); }
</style>
