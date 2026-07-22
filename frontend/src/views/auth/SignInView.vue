<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import SignInButton from '@/components/auth/SignInButton.vue';
import '@/assets/auth-shared.css';

const authStore = useAuthStore();

const showCredentialsForm = ref(false);

const identifier = ref('');
const password = ref('');
const passwordConfirm = ref('');
const localError = ref('');

function handleGoogleSuccess(response: any) {
    localError.value = '';

    if (authStore.requiresGoogleLink) {
        if (password.value !== passwordConfirm.value) {
            localError.value = 'Passwords do not match.';
            return;
        }
    }

    if (response.credential) authStore.signInWithGoogle(response.credential);
}

function handleGoogleError() {
    authStore.error = 'Google Sign-In initialization failed.';
}

function handleSubmit() {
    localError.value = '';

    if (authStore.requiresConfirmation) {
        if (password.value !== passwordConfirm.value) {
            localError.value = 'Passwords do not match. Please try again.';
            return;
        }
    }

    authStore.signInWithCredentials(identifier.value, password.value);
}

function handleCancel() {
    authStore.resetAuthState();
    password.value = '';
    passwordConfirm.value = '';
    localError.value = '';
    showCredentialsForm.value = false;
}
</script>

<template>
    <div class="auth-wrapper">
        <div class="auth-card">
            <h2 class="auth-title">Welcome to PreciseMath</h2>

            <div v-if="!authStore.requiresGoogleLink" class="oauth-section">
                <SignInButton
                    @success="handleGoogleSuccess"
                    @error="handleGoogleError"
                    :disabled="authStore.isLoading"
                />
                <p class="oauth-hint">One-click access</p>
            </div>

            <div v-if="!authStore.requiresGoogleLink" class="divider">
                <span>or</span>
            </div>

            <div v-if="authStore.requiresGoogleLink" class="banner-warning">
                <p><strong>Account Action Required:</strong></p>
                <p>{{ authStore.error }}</p>

                <div class="form-group" style="margin-top: 1rem;">
                    <label for="linkPasswordConfirm" style="color: #333;">Confirm Password</label>
                    <input
                        id="linkPasswordConfirm"
                        v-model="passwordConfirm"
                        type="password"
                        placeholder="Re-type password to confirm"
                        :disabled="authStore.isLoading"
                    />
                </div>

                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Click below to link your account.</p>

                <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
                    <SignInButton
                        @success="handleGoogleSuccess"
                        @error="handleGoogleError"
                        :disabled="authStore.isLoading"
                    />
                </div>

                <div style="text-align: center; margin-top: 1rem;">
                    <button
                        @click="handleCancel"
                        type="button"
                        class="button"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <div v-if="authStore.requiresConfirmation" class="banner-warning">
                <p><strong>Confirm Account Creation:</strong></p>
                <p>{{ authStore.error }}</p>
            </div>

            <div v-if="!showCredentialsForm && !authStore.requiresGoogleLink" class="reveal-container">
                <button
                    @click="showCredentialsForm = true"
                    class="text-button"
                    style="margin-top:0;"
                >
                    Use username/email and password instead
                </button>
            </div>

            <form v-if="showCredentialsForm && !authStore.requiresGoogleLink" @submit.prevent="handleSubmit" class="auth-form">
                <div class="form-group">
                    <label for="identifier">Username or Email</label>
                    <input
                        id="identifier"
                        v-model="identifier"
                        type="text"
                        required
                        placeholder="Enter username or email"
                        :disabled="authStore.isLoading"
                    />
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        required
                        placeholder="Password"
                        :disabled="authStore.isLoading"
                    />
                </div>

                <div v-if="authStore.requiresConfirmation" class="form-group">
                    <label for="passwordConfirm">Password Confirmation</label>
                    <input
                        id="passwordConfirm"
                        v-model="passwordConfirm"
                        type="password"
                        required
                        placeholder="Re-type your password"
                        :disabled="authStore.isLoading"
                    />
                </div>

                <button
                    type="submit"
                    class="btn-primary"
                    :disabled="authStore.isLoading"
                >
                    {{ authStore.isLoading ? 'Processing...' : 'Continue with username and password' }}
                </button>

                <button
                    @click="showCredentialsForm = false"
                    type="button"
                    class="text-button"
                >
                    Cancel
                </button>
            </form>


            <p v-if="localError" class="error-banner">
                {{ localError }}
            </p>

            <p v-if="authStore.error && !authStore.requiresGoogleLink && !authStore.requiresConfirmation" class="error-banner">
                {{ authStore.error }}
            </p>
        </div>
    </div>
</template>

<style scoped>
.oauth-hint {
    font-size: 0.75rem;
    color: #6a737d;
    text-align: center;
    margin-top: 0.75rem;
}
.reveal-container {
    display: flex;
    justify-content: center;
}
</style>
