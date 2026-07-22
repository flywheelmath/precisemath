<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import '@/assets/auth-shared.css';

const authStore = useAuthStore();
</script>

<template>
    <div class="auth-wrapper">
        <div class="auth-card danger-card">
            <h2 class="auth-title" style="color: #d73a49;">Delete Account</h2>

            <p class="warning-text">
                Permanently erasing your account.
                Your personal identifiers will be deleted and not recoverable.
            </p>

            <div style="margin-top: 1.5rem;">
                <button
                    @click="authStore.deleteAccount"
                        :disabled="authStore.isLoading"
                        class="btn-danger"
                        style="width: 100%;"
                >
                    {{ authStore.isLoading ? 'Deleting...' : 'I understand, delete my account' }}
                </button>
            </div>

            <p v-if="authStore.error" class="error-banner">
                {{ authStore.error }}
            </p>
        </div>
    </div>
</template>

<style scoped>
.danger-card {
    border-color: #ffdce0;
}
.warning-text {
    color: #586069;
    line-height: 1.5;
}
</style>
