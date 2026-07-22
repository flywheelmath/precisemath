<script setup lang="ts">
import { computed, watch } from 'vue';
import { useSessionStore } from '@/stores/session';
import { useSystemInequalityState } from '@/composables/useSystemInequalityState';
import { useInteractionConfig } from '@/composables/useInteractionConfig';
import { useGraphInputState } from '@/composables/useGraphInputState';
import { vKatex } from '@/directives/katex';
import MCAPCoordinatePlane from '@/components/MCAPCoordinatePlane.vue';
import PromptDisplay from '@/components/PromptDisplay.vue';
import SessionClock from '@/components/SessionClock.vue';
import ScoresDisplay from '@/components/ScoresDisplay.vue';

const emit = defineEmits(['submit']);
const sessionStore = useSessionStore();
const currentPrompt = computed(() => sessionStore.currentPrompt);
const skillLevels = computed(() => sessionStore.skillLevels);

const { interactionConfig } = useInteractionConfig(
    computed(() => sessionStore.categorySlug),
    computed(() => sessionStore.skillSlug),
    currentPrompt,
    skillLevels,
);

const systemState = useSystemInequalityState(currentPrompt, skillLevels);
const lineState = useGraphInputState(currentPrompt, skillLevels);

const isSystemMode = computed(() => interactionConfig.value !== 'graph-line-mcap-default');
const isLocked = computed(() => 
    ['system-region-only', 'system-boundary-and-region'].includes(interactionConfig.value)
);

const showBoundaryToggles = computed(() => 
    interactionConfig.value === 'system-boundary-and-region' || 
    interactionConfig.value === 'default' ||
    interactionConfig.value === 'graph-linear-system-mcap-default'
);

const activeState = computed(() => isSystemMode.value ? systemState : lineState);
const ineq1 = computed(() => currentPrompt.value?.data?.inequalities?.[0]);
const ineq2 = computed(() => currentPrompt.value?.data?.inequalities?.[1]);

const canSelectSolution = computed(() => 
  systemState.line1Points.value.length === 2 || 
  systemState.line2Points.value.length === 2
);

const canSubmit = computed(() => {
  if (isSystemMode.value) {
    const hasRegion = systemState.shadingPoints.value.length > 0;
    const hasPoints = systemState.line1Points.value.length > 0 || systemState.line2Points.value.length > 0;
    return isLocked.value ? hasRegion : (hasRegion || hasPoints);
  }
  return lineState.userPoints.value.length === 2 || lineState.shadingSide.value !== null;
});

function handleSubmit() {
  if (canSubmit.value) {
    if (isSystemMode.value) {
        systemState.syncResponse(sessionStore.updateResponse);
    }
    sessionStore.submit(sessionStore.currentResponse);
  }
}

function handleDismissFeedback() {
  sessionStore.dismissFeedback();
  systemState.reset();
  lineState.reset();
}

watch(
  [systemState.line1IsDashed, systemState.line2IsDashed],
  () => {
    if (isSystemMode.value) {
        systemState.syncResponse(sessionStore.updateResponse);
    }
  }
);
</script>

<template>
  <div v-if="currentPrompt" class="two-column-layout">
    <div class="left-column">
      <PromptDisplay :prompt="currentPrompt" />
      
      <template v-if="isSystemMode">
        <div v-if="ineq1" 
             class="inequality-box" 
             :class="{ active: systemState.activeLayer.value === 'line1' }" 
             style="--active-color: #3498db" 
             @click="systemState.setActiveLayer('line1')">
          <div class="math-display" v-katex="ineq1.math"></div>
          
          <div v-if="showBoundaryToggles" class="style-toggle" @click.stop>
            <label class="style-option">
              <input type="radio" :value="false" v-model="systemState.line1IsDashed.value" name="line1-style">
              <svg width="55" height="20" class="line-icon"><line x1="0" y1="10" x2="55" y2="10" stroke="currentColor" stroke-width="4" /></svg>
            </label>
            <label class="style-option">
              <input type="radio" :value="true" v-model="systemState.line1IsDashed.value" name="line1-style">
              <svg width="55" height="20" class="line-icon"><line x1="0" y1="10" x2="55" y2="10" stroke="currentColor" stroke-width="4" stroke-dasharray="10,5" /></svg>
            </label>
          </div>
        </div>

        <div v-if="ineq2" 
             class="inequality-box" 
             :class="{ active: systemState.activeLayer.value === 'line2' }" 
             style="--active-color: #9b59b6" 
             @click="systemState.setActiveLayer('line2')">
          <div class="math-display" v-katex="ineq2.math"></div>
          
          <div v-if="showBoundaryToggles" class="style-toggle" @click.stop>
            <label class="style-option">
              <input type="radio" :value="false" v-model="systemState.line2IsDashed.value" name="line2-style">
              <svg width="55" height="20" class="line-icon"><line x1="0" y1="10" x2="55" y2="10" stroke="currentColor" stroke-width="4" /></svg>
            </label>
            <label class="style-option">
              <input type="radio" :value="true" v-model="systemState.line2IsDashed.value" name="line2-style">
              <svg width="55" height="20" class="line-icon"><line x1="0" y1="10" x2="55" y2="10" stroke="currentColor" stroke-width="4" stroke-dasharray="10,5" /></svg>
            </label>
          </div>
        </div>

        <button class="solution-btn" 
                :class="{ active: systemState.activeLayer.value === 'solution' }"
                :disabled="!canSelectSolution"
                @click="systemState.setActiveLayer('solution')">
          Solution Region
        </button>
      </template>

      <SessionClock :is-running="sessionStore.isClockRunning" @time-up="sessionStore.handleTimeUp" />
      <ScoresDisplay :log="sessionStore.sessionLog" />
    </div>

    <div class="right-column">
      <MCAPCoordinatePlane
        v-bind="activeState.dynamicConfig.value"
        :feedback-state="sessionStore.feedbackState"
        @point-selected="(p) => activeState.handlePointClick(p, sessionStore.updateResponse)"
        @drag-start="(p) => activeState.handleDragStart(p)"
        @drag-end="(p) => activeState.handleDragEnd(p, sessionStore.updateResponse)"
      />
      
      <div class="action-footer">
        <template v-if="!sessionStore.isShowingFeedback">
          <button v-if="!isLocked" class="btn-clear" @click="activeState.reset">Clear</button>
          <button class="btn-submit" :disabled="!canSubmit" @click="handleSubmit">Submit</button>
        </template>
        <template v-else>
          <button 
            class="btn-submit" 
            @click="handleDismissFeedback"
            :disabled="sessionStore.isFeedbackLocked"
          >
            Try another
          </button>
        </template>
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
.inequality-box { padding: 1rem; border: 3px solid var(--active-color); cursor: pointer; border-radius: 8px; transition: all 0.2s; opacity: 0.7; }
.inequality-box.active { background: color-mix(in srgb, var(--active-color), transparent 85%); font-weight: bold; opacity: 1; border-right-width: 20px; }
.math-display { font-size: 1.25rem; margin-bottom: 0.5rem; }
.style-toggle { margin-top: 0.5rem; display: flex; gap: 1rem; align-items: center; }
.style-option { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; }
.line-icon { color: var(--active-color); display: block; }
.solution-btn { width: 100%; padding: 1rem; border: 2px solid var(--color-ui-border); border-radius: 8px; font-weight: bold; background: var(--color-ui-bg); color: var(--color-text); transition: all 0.2s; margin-top: 0.5rem; }
.solution-btn.active { background: #16a085; color: white; border-color: #16a085; }
.action-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem; }
.btn-clear { padding: 6px 16px; background: var(--color-ui-danger-bg); color: var(--color-ui-danger); border: 1px solid var(--color-ui-danger); border-radius: 4px; cursor: pointer; }
.btn-submit { padding: 8px 20px; background: var(--color-graph-correct); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; background: var(--color-ui-text-secondary); }
</style>
