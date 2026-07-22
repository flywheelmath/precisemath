<script setup lang="ts">
import { watch } from 'vue';
import { RouterView } from 'vue-router';
import { useIdentityStore } from '@/stores/identity';
import { useTheme } from '@/composables/useTheme';

const identityStore = useIdentityStore();

useTheme();

watch(
    () => [identityStore.isAuthenticated, identityStore.hasGuestAccess],
    ([isAuth, isGuest]) => {
        document.documentElement.classList.remove('theme-registered', 'theme-guest');

        if (isAuth) {
            document.documentElement.classList.add('theme-registered');
        }
        else if (isGuest) {
            document.documentElement.classList.add('theme-guest');
        }
    },
    { immediate: true }
);
</script>

<template>
    <RouterView />
</template>

<style scoped></style>
