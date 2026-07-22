<script lang="ts">
import { defineComponent, ref, watch, computed, reactive } from 'vue';
import type { PropType } from 'vue';
import { Line } from 'vue-chartjs';
import 'chartjs-adapter-date-fns';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, LineController, TimeScale, LogarithmicScale, PointElement, Filler } from 'chart.js';
import { useTheme } from '@/composables/useTheme';

ChartJS.register(Title, Tooltip, Legend, LineElement, LineController, TimeScale, LogarithmicScale, PointElement, Filler);

interface CelerationData {
  labels: string[];
  average_data: number[];
  best_data: number[];
}

export default defineComponent({
  name: 'CelerationChart',
  components: { Line },
  props: {
    chartDataProp: {
      type: Object as PropType<CelerationData | null>,
      required: true
    }
  },
  setup(props) {
    const { isDark } = useTheme();
    const colors = reactive({
      average: '',
      best: '',
      grid: '',
      text: '',
    });

    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement);
      colors.average = styles.getPropertyValue('--color-ui-success').trim();
      colors.best = styles.getPropertyValue('--color-ui-primary').trim();
      colors.grid = styles.getPropertyValue('--color-ui-border').trim();
      colors.text = styles.getPropertyValue('--color-ui-text-secondary').trim();
    };

    const chartData = computed(() => {
      const labels = props.chartDataProp?.labels || [];
      const avgData = props.chartDataProp?.average_data || [];
      const bestData = props.chartDataProp?.best_data || [];

      return {
        labels,
        datasets: [
          {
            label: 'Daily Average',
            backgroundColor: colors.average, 
            borderColor: colors.average,
            data: labels.map((label: string, index: number) => ({
              x: new Date(label).getTime(),
              y: avgData[index] ?? 0,
            })),
            fill: false,
            pointRadius: 5,
          },
          {
            label: 'Daily Best',
            backgroundColor: colors.best, 
            borderColor: colors.best,
            data: labels.map((label: string, index: number) => ({
              x: new Date(label).getTime(),
              y: bestData[index] ?? 0,
            })),
            fill: false,
            showLine: false,
            pointRadius: 5,
          }
        ],
      };
    });

    const hasData = computed(() => chartData.value.labels.length > 0);

    const chartOptions = computed(() => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { 
          type: 'logarithmic' as const, 
          title: { display: true, text: 'Responses per Minute', color: colors.text },
          ticks: { color: colors.text },
          grid: { color: colors.grid },
        },
        x: { 
          type: 'time' as const, 
          time: { unit: 'day' as const, tooltipFormat: 'MMM d, yyyy' }, 
          title: { display: true, text: 'Date', color: colors.text },
          ticks: { color: colors.text },
          grid: { color: colors.grid },
        },
      },
    }));

    const updateDatasets = () => {
      if (!props.chartDataProp) return;
      if (chartData.value.datasets[0]) {
        chartData.value.datasets[0].backgroundColor = colors.average;
        chartData.value.datasets[0].borderColor = colors.average;
      }
      if (chartData.value.datasets[1]) {
        chartData.value.datasets[1].backgroundColor = colors.best;
        chartData.value.datasets[1].borderColor = colors.best;
      }

      if (props.chartDataProp.labels) {
        chartData.value.labels = props.chartDataProp.labels;

        if (chartData.value.datasets[0]) {
          chartData.value.datasets[0].data = props.chartDataProp.labels.map((label, index) => ({
            x: new Date(label).getTime(),
            y: props.chartDataProp!.average_data[index] ?? 0
          }));
        }
        if (chartData.value.datasets[1]) {
          chartData.value.datasets[1].data = props.chartDataProp.labels.map((label, index) => ({
            x: new Date(label).getTime(),
            y: props.chartDataProp!.best_data[index] ?? 0
          }));
        }
      }

    };

    watch(() => props.chartDataProp, updateDatasets, { deep: true, immediate: true });

    watch(isDark, () => {
      setTimeout(() => {
        updateColors();
        updateDatasets();
      }, 50);
    }, { immediate: true });

    return { chartData, chartOptions, hasData, colors };
  }
});
</script>

<template>
  <div class="chart-container">
    <h2>Daily Performance</h2>
    <Line v-if="hasData" :data="chartData" :options="chartOptions" />
    <p v-else>Keep practicing to build up enough daily data for this chart! At least 10 responses in a day is required.</p>
    <div v-if="hasData" class="chart-legend">
        <span class="legend-item"><span class="color-box average"></span> Daily Average</span>
        <span class="legend-item"><span class="color-box best"></span> Daily Best</span>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--color-ui-text-primary);
}
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-ui-text-secondary);
}
.color-box {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  display: inline-block;
}
</style>
