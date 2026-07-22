<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';

export default defineComponent({
  name: 'MathFactGrid',
  props: {
    title: { type: String, required: true },
    gridDataProp: {
      type: Object as PropType<Record<string, number> | null>,
      required: true
    },
    colorScheme: {
      type: String as PropType<'accuracy' | 'fluency'>,
      default: 'accuracy'
    }
  },
  setup(props) {
    const hasData = computed(() => props.gridDataProp && Object.keys(props.gridDataProp).length > 0);

    const getValue = (factor1: number, factor2: number): number | undefined => {
        if (!props.gridDataProp) return undefined;
        const key = `${factor1}x${factor2}`;
        return props.gridDataProp[key];
    };

    const getCellStyle = (factor1: number, factor2: number) => {
      const value = getValue(factor1, factor2);
      if (value === undefined) {
            return { backgroundColor: 'var(--color-ui-surface-soft)' };
      }

        if (props.colorScheme === 'fluency') {
            if (value < -1) return { backgroundColor: '#e74c3c' };
            if (value < -0.7) return { backgroundColor: '#f39c12' };
            if (value < -0.3) return { backgroundColor: '#f1c40f' };
            if (value < 0.3) return { backgroundColor: '#2ecc71' };
            if (value < 0.3) return { backgroundColor: '#2ecc71' };
            return { backgroundColor: '#3498db' };
        } else {
            const hue = 120 * (value ** 4);
            return { backgroundColor: `hsl(${hue}, 80%, 50%)` };
        }
    };

    const getCellTooltip = (factor1: number, factor2: number): string => {
        const value = getValue(factor1, factor2);
        if (value === undefined) {
            return 'No data';
        }

        if (props.colorScheme === 'fluency') {
            const sign = value > 0 ? '+' : '';
            return `Fluency: ${sign}${value.toFixed(2)} standard deviations from your average`;
        } else {
            return `Accuracy: ${Math.round(value * 100)}%`;
        }
    };

    return { hasData, getCellStyle, getCellTooltip };
  }
});
</script>

<template>
  <div class="fact-grid-container">
    <h2>{{ title }}</h2>
    <div v-if="hasData" class="grid">
      <div class="grid-cell header"></div>
      <div
          v-for="col in 13"
          :key="`header-${col-1}`"
          class="grid-cell header"
      >
          {{ col - 1 }}
      </div>
      
      <template v-for="row in 13" :key="`row-${row-1}`">
        <div class="grid-cell header">{{ row - 1 }}</div>
        <div
            v-for="col in 13"
            :key="`cell-${row-1}-${col-1}`"
            class="grid-cell"
            :style="getCellStyle(row - 1, col - 1)"
            :title="getCellTooltip(row - 1, col - 1)"
        >
        </div>
      </template>
    </div>
    <p v-else>Practice this skill to see your fluency grid!</p>
  </div>
</template>

<style scoped>
.fact-grid-container {
  margin-top: 2rem;
  color: var(--color-ui-text-primary);
}
.grid {
  display: grid;
  width: 100%;
  max-width: 500px;
  grid-template-columns: repeat(14, 1fr);
  gap: 3px;
  margin: 1rem auto;
}
.grid-cell {
  position: relative;
  background-color: var(--color-ui-surface-soft);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  aspect-ratio: 1 / 1;
  color: var(--color-ui-text-primary);
}
.grid-cell.header {
  background-color: transparent;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-ui-text-secondary);
}
</style>
