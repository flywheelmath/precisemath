<script setup lang="ts">
import { ref } from 'vue';
import SignInButton from '@/components/auth/SignInButton.vue';
import { api } from '@/services/api';

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

async function submitChange(googleToken: string | null = null) {
    errorMessage.value = '';
    successMessage.value = '';

    if (!newPassword.value || newPassword.value !== confirmPassword.value) {
        errorMessage.value = 'New passwords do not match.';
        return;
    }

    if (!googleToken && !currentPassword.value) {
        errorMessage.value = 'Please enter your current password or verify with Google.';
        return;
    }

    isLoading.value = true;
    try {
        await api.post('/auth/password-reset/', {
            new_password: newPassword.value,
            current_password: currentPassword.value || undefined,
            google_id_token: googleToken || undefined
        });
        
        successMessage.value = 'Password successfully updated.';
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
    }
    catch (err: any) {
        errorMessage.value = err.response?.data?.error || 'Failed to update password.';
    }
    finally {
        isLoading.value = false;
    }
}

function handleGoogleSuccess(response: any) {
    if (response.credential) submitChange(response.credential);
}

function handleGoogleError() {
    errorMessage.value = 'Google verification failed. Please try again.';
}
</script>

<template>
    <div class="settings-card auth-card">
        <h3 class="auth-title" style="margin-bottom: 1.5rem;">Change Password</h3>
        
        <div v-if="successMessage" class="banner-success">
            {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-banner">
            {{ errorMessage }}
        </div>

        <form @submit.prevent="submitChange(null)" class="auth-form">
            <div class="form-group">
                <label>Current Password</label>
                <input
                    v-model="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    :disabled="isLoading"
                />
            </div>

            <div class="divider">
                <span>OR</span>
            </div>

            <div class="form-group oauth-section">
                <label style="text-align: center; margin-bottom: 0.5rem; display: block;">
                    Verify with Google instead
                </label>
                <SignInButton
                    @success="handleGoogleSuccess"
                    @error="handleGoogleError"
                    :disabled="isLoading"
                />
                <p class="oauth-hint">Use this if you forgot your current password.</p>
            </div>

            <hr style="margin: 1.5rem 0; border-top: 1px solid #e1e4e8;" />

            <div class="form-group">
                <label>New Password</label>
                <input
                    v-model="newPassword"
                    type="password"
                    required
                    placeholder="Enter new password"
                    :disabled="isLoading"
                />
            </div>

            <div class="form-group">
                <label>Confirm New Password</label>
                <input
                    v-model="confirmPassword"
                    type="password"
                    required
                    placeholder="Re-type new password"
                    :disabled="isLoading"
                />
            </div>

            <button type="submit" class="btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Saving...' : 'Update Password' }}
            </button>
        </form>
    </div>
</template>

<style scoped>
.oauth-hint {
    font-size: 0.75rem;
    color: #6a737d;
    text-align: center;
    margin-top: 0.75rem;
}
.banner-success {
    background-color: #d4edda;
    color: #155724;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-align: center;
}
</style>
