<script setup lang="ts">
import { GoogleSignInButton } from 'vue3-google-signin';

const emit = defineEmits(['success', 'error']);
defineProps<{ disabled?: boolean }>();
</script>

<template>
    <div class="signin-button-wrapper" :class="{ 'is-disabled': disabled }">
        <GoogleSignInButton
            @success="(res) => emit('success', res)"
            @error="(err) => emit('error', err)"
        />
    </div>
</template>

<style scoped>
.signin-button-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
}
.is-disabled {
    opacity: 0.6;
    pointer-events: none;
}
</style>
