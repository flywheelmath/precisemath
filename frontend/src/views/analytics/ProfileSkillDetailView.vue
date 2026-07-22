<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '@schoolpanel/auth';
import CelerationChart from '@/components/CelerationChart.vue';
import CombinedRollingChart from '@/components/CombinedRollingChart.vue';
import MathFactGrid from '@/components/MathFactGrid.vue';

const props = defineProps({
  categorySlug: { type: String, required: false },
  skillSlug: { type: String, required: false },
  studentId: { type: [String, Number], required: false }
});

const route = useRoute();

const effectiveCategory = computed(() => props.categorySlug || route.params.category_slug as string);
const effectiveSkill = computed(() => props.skillSlug || route.params.skill_slug as string);

const celerationChartData = ref(null);
const rollingChartData = ref(null);
const accuracyGridData = ref(null);
const fluencyGridData = ref(null);
const isLoading = ref(true);

async function loadData() {
    if (!effectiveCategory.value || !effectiveSkill.value) return;

    isLoading.value = true;
    try {
        const url = `/api/profile/${effectiveCategory.value}/${effectiveSkill.value}/`;
        const params = props.studentId ? { student_id: props.studentId } : {};
        
        const response = await apiClient.get(url, { params });
        celerationChartData.value = response.data.celeration_chart;
        rollingChartData.value = response.data.rolling_chart;
        accuracyGridData.value = response.data.math_fact_accuracy_grid;
        fluencyGridData.value = response.data.math_fact_fluency_grid;
    } catch (error) {
        console.error("Failed to load skill profile data:", error);
    } finally {
        isLoading.value = false;
    }
}

onMounted(loadData);

watch(() => [props.studentId, effectiveSkill.value], loadData);
</script>

<template>
  <div class="profile-skill-container">
    <h1>Performance for {{ effectiveSkill }}</h1>
    <div v-if="isLoading">Loading...</div>
    <div v-else>
        <CelerationChart v-if="celerationChartData" :chart-data-prop="celerationChartData" />
        <CombinedRollingChart v-if="rollingChartData" :chart-data-prop="rollingChartData" />
        
        <MathFactGrid
            v-if="accuracyGridData"
            :grid-data-prop="accuracyGridData"
            title="Math Fact Accuracy Grid"
            color-scheme="accuracy"
        />
        <MathFactGrid
            v-if="fluencyGridData"
            :grid-data-prop="fluencyGridData"
            title="Math Fact Fluency Grid"
            color-scheme="fluency"
        />
    </div>
  </div>
</template>

<style scoped>
.profile-skill-container {
    max-width: 1000px;
    margin: 2rem auto;
    padding: 0 2rem;
    color: var(--color-ui-text-primary);
}

h1 {
    text-align: center;
    margin-bottom: 2rem;
}
</style>
