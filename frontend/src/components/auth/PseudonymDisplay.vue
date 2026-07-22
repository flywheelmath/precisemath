<script setup lang="ts">
import { useIdentityStor } from '@/stores/identity';
const identityStore = useIdentityStore();
</script>

<template>
    <div v-if="identityStore.displayName" class="pseudonym-display">
        <span class="avatar-icon">&#x1F464;</span>
        <span class="name">{{ identityStore.displayName }}</span>
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
</style>
