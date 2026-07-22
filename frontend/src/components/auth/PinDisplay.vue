<script setup lang="ts">
import { useIdentityStor } from '@/stores/identity';
const identityStore = useIdentityStore();
</script>

<template>
    <div v-if="identityStore.pin" class="pin-badge">
        PIN: <span class="pin-code">{{ identityStore.pin }}</span>
    </div>
</template>

<style scoped>
.pin-badge {
    font-size: 0.85rem;
    font-weight: 500;
    color: #586069;
    background: #f1f8ff;
    border: 1px solid #c8e1ff;
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    display: inline-block;
}
</style>
