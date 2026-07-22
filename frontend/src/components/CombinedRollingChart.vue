<script lang="ts">
import { defineComponent, ref, watch, computed, reactive } from 'vue';
import type { PropType } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, LineController, CategoryScale, LinearScale, PointElement, Filler } from 'chart.js';
import { useTheme } from '@/composables/useTheme';

ChartJS.register(Title, Tooltip, Legend, LineElement, LineController, CategoryScale, LinearScale, PointElement, Filler);

interface RollingData {
  rate_data: number[];
  accuracy_data: number[];
}

export default defineComponent({
  name: 'CombinedRollingChart',
  components: { Line },
  props: {
    chartDataProp: {
      type: Object as PropType<RollingData | null>,
      required: true
    }
  },
  setup(props) {
    const { isDark } = useTheme();

    const colors = reactive({
      rate: '',
      rateFill: '',
      accuracy: '',
      accuracyFill: '',
      grid: '',
      text: '',
    });

    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement);

      const primary = styles.getPropertyValue('--color-ui-primary').trim();
      const success = styles.getPropertyValue('--color-ui-success').trim();
      const successBg = styles.getPropertyValue('--color-ui-success-bg').trim();

      colors.rate = primary;
      colors.rateFill = primary.startsWith('#') ? primary + '33' : primary;

      colors.accuracy = success;
      colors.accuracyFill = successBg || (success.startsWith('#') ? success + '33' : success);

      colors.grid = styles.getPropertyValue('--color-ui-border').trim();
      colors.text = styles.getPropertyValue('--color-ui-text-secondary').trim();
    };

    const chartData = computed(() => {
      const rateData = props.chartDataProp?.rate_data || [];
      const accuracyData = props.chartDataProp?.accuracy_data || [];
      const labels = rateData.map((_: number, i: number) => `Response ${i + 1}`);

      return {
        labels,
        datasets: [
          {
            label: 'Correct Responses per Minute',
            borderColor: colors.rate,
            backgroundColor: colors.rateFill,
            data: rateData,
            fill: true,
            tension: 0.1,
            yAxisID: 'yRate',
          },
          {
            label: 'Accuracy (%)',
            borderColor: colors.accuracy,
            backgroundColor: colors.accuracyFill,
            data: accuracyData,
            fill: true,
            tension: 0.1,
            yAxisID: 'yAccuracy',
          },
        ],
      };
    });

    const hasData = computed(() => (props.chartDataProp?.rate_data.length ?? 0) > 0);

    const chartOptions = computed(() => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yRate: {
          type: 'linear' as const,
          position: 'left' as const,
          title: { display: true, text: 'Responses per Minute', color: colors.rate },
          ticks: { color: colors.rate },
          grid: { color: colors.grid },
        },
        yAccuracy: {
          type: 'linear' as const,
          position: 'right' as const,
          min: 0,
          max: 100,
          title: { display: true, text: 'Accuracy (%)', color: colors.accuracy },
          ticks: { color: colors.accuracy },
          grid: { drawOnChartArea: false },
        },
        x: { display: false, grid: { color: colors.grid } },
      },
      plugins: {
        legend: { labels: { color: colors.text } }
      }
    }));

    watch(isDark, () => {
      setTimeout(() => { updateColors(); }, 50);
    }, { immediate: true });

    return { chartData, chartOptions, hasData };
  }
});
</script>


<template>
  <div class="chart-container">
    <h2>Rolling Performance (Last 20 Responses)</h2>
    <Line v-if="hasData" :data="chartData" :options="chartOptions" />
    <p v-else>Keep practicing to see your rolling performance trends!</p>
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
</style>
