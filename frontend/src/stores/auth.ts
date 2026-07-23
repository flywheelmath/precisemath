// src/stores/auth.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useIdentityStore } from './identity';
import { authService } from '@/services/authService';

export const useAuthStore = defineStore('auth', () => {
    const identityStore = useIdentityStore();
    const router = useRouter();

    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const requiresGoogleLink = ref(false);
    const requiresConfirmation = ref(false);
    const pendingLinkToken = ref<string | null>(null);

    function clearError() {
        error.value = null;
        requiresGoogleLink.value = false;
        pendingLinkToken.value = null;
    }

    async function signInWithCredentials(identifierStr: string, passwordStr: string) {
        if (!identifierStr || !passwordStr) return;
        isLoading.value = true;
        clearError();

        if (requiresConfirmation.value) {
            try {
                const response = await authService.signupWithCredentials(identifierStr, passwordStr);
                identityStore.login(response.uuid, {
                    id: response.uuid,
                    is_guest: false,
                    display_name: identifierStr,
                    pin: response.uuid.slice(-4),
                });
                requiresConfirmation.value = false;
                await router.push('/');
                return;
            }
            catch (err: any) {
                if (err.response?.status === 409) {
                    requiresGoogleLink.value = true;
                    pendingLinkToken.value = err.response.data.link_token;
                    error.value = "This email uses Google Sign-In. Click 'Continue with Google to link your password.";
                }
                else {
                    const apiError = err.response?.data?.error || err.response?.data?.detail;
                    error.value = Array.isArray(apiError) ? apiError[0] : (apiError || 'Incorrect username or password.');
                }
                isLoading.value = false;
                return;
            }
        }

        try {
            const response = await authService.loginWithCredentials(identifierStr, passwordStr);
            identityStore.login(response.uuid, {
                id: response.uuid,
                is_guest: false,
                display_name: identifierStr,
                pin: response.uuid.slice(-4),
            });
            resetAuthState();
            await router.push('/');
        }
        catch (loginErr: any) {
            if (loginErr.response?.status === 404) {
                requiresConfirmation.value = true;
                error.value = "We don't have an account for this username/email. Submit your password again to confirm account creation.";
            }
            else if (loginErr.response?.status === 409) {
                requiresGoogleLink.value = true;
                pendingLinkToken.value = loginErr.response.data.link_token;
                error.value = "This account uses Google Sign-In. Re-type your password below, then click 'Sign in with Google'.";
            }
            else {
                error.value = loginErr.response?.data?.error || 'Incorrect password.';
            }
        }
        finally {
            isLoading.value = false;
        }
    }

    async function signInWithGoogle(idToken: string) {
        isLoading.value = true;
        error.value = null;

        try {
            const data = await authService.signInWithGoogle(idToken, pendingLinkToken.value);

            requiresGoogleLink.value = false;
            pendingLinkToken.value = null;

            identityStore.login(data.uuid, {
                id: data.uuid,
                is_guest: false,
                display_name: data.display_name,
                pin: data.pin,
            });
            resetAuthState();
            await router.push('/');
        }
        catch (err: any) {
            error.value = err.response?.data?.error || 'Google sign-in failed.';
            console.error('Google Auth error:', err);
        }
        finally {
            isLoading.value = false;
        }
    }

    async function logout() {
        isLoading.value = true;
        try {
            await authService.logout();
            identityStore.clearIdentity();
            resetAuthState();
            await router.push('/signin');
        }
        catch (err: any) {
            console.error('Logout failed:', err);

        }
        finally {
            isLoading.value = false;
            identityStore.clearIdentity;
            router.push({ name: 'signin' });
        }
    }

    async function deleteAccount() {
        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        isLoading.value = true;
        try {
            await authService.deleteAccount();
            identityStore.clearIdentity();
            resetAuthState();
            await router.push('/signin');
        }
        catch (err: any) {
            error.value = err.response?.data?.error || 'Failed to delete account.';
            console.error('Account deletion failed:', err);
        }
        finally {
            isLoading.value = false;
        }
    }

    function resetAuthState() {
        error.value = null;
        requiresGoogleLink.value = false;
        requiresConfirmation.value = false;
        pendingLinkToken.value = null;
        isLoading.value = false;
    }

    return {
        isLoading,
        error,
        requiresGoogleLink,
        requiresConfirmation,

        clearError,
        resetAuthState,
        signInWithCredentials,
        signInWithGoogle,
        logout,
        deleteAccount,
    }
});
