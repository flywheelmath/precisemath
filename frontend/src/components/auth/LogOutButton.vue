<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
</script>

<template>
    <button
        @click="authStore.logout"
        :disabled="authStore.isLoading"
        class="btn-logout"
    >
        {{ authStore.isLoading ? 'Logging out...' : 'Log out' }}
    </button>
</template>

<style scoped>
.btn-logout {
    padding: 0.5rem 1rem;
    background-color: #f6f8fa;
    border: 1px solid rgba(27, 31,35, 0.15);
    border-radius: 4px;
    color: #24292e;
    font-weight: 500;
    cursor: pointer;
}
.btn-logout:hover {
    background-color: #e1e4e8;
}
</style>
