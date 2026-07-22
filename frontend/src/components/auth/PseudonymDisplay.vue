<script setup lang="ts">
import { useIdentityStore } from '@/stores/identity';
const identityStore = useIdentityStore();
</script>

<template>
    <div v-if="identityStore.player?.display_name" class="pseudonym-display">
        <span class="avatar-icon">&#x1F464;</span>
        <span class="name">{{ identityStore.player.display_name }}</span>
    </div>
    <div v-else class="pseudonym-display loading">
        <span class="name">Loading...</span>
    </div>
</template>

<style scoped>
.pseudonym-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #24292e;
}
.avatar-icon {
    font-size: 1rem;
}
.loading {
    color: var(--color-ui-text-secondary);
    font-style: italic;
}
</style>
