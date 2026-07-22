<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';

const { preference, cycleTheme } = useTheme();

const icon = computed(() => {
  switch (preference.value) {
    case 'light': return '☀️';
    case 'dark':  return '🌙';
    case 'auto': return '🖥️';
  }
});

const label = computed(() => {
  switch (preference.value) {
    case 'light': return 'Light';
    case 'dark':  return 'Dark';
    case 'auto': return 'Device';
  }
});
</script>

<template>
  <button
    @click="cycleTheme"
    class="theme-toggle"
    :title="`Theme: ${label}`"
  >
    <span class="icon">{{ icon }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  background: none;
  border: 1px solid var(--color-ui-border);
  color: var(--color-text);
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: background-color 0.2s;
}

.theme-toggle:hover {
  background-color: var(--color-ui-surface-soft);
}
</style>
