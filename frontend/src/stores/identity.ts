import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import type { AuthState, PlayerProfile } from '@/types/auth';

export const useIdentityStore = defineStore('identity', () => {
    const authToken = ref<string | null>(localStorage.getItem('auth_token'));
    const guestToken = ref<string | null>(localStorage.getItem('guest_token'));
    const player = ref<PlayerProfile | null>(null);

    const isAuthenticated = computed<boolean>(() => !!authToken.value);
    const hasGuestAccess = computed<boolean>(() => !!guestToken.value);
    const isIdentityLoaded = computed<boolean>(() => player.value !== null);

    function setAuthToken(token: string) {
        authToken.value = token;
        localStorage.setItem('auth_token', token);
        clearGuestToken();
    }

    function setGuestToken(token: string) {
        guestToken.value = token;
        localStorage.setItem('guest_token', token);
    }

    function setPlayerProfile(profile: PlayerProfile) {
        player.value = profile;
    }

    function clearGuestToken() {
        guestToken.value = null;
        localStorage.removeItem('guest_token');
    }

    function clearIdentity() {
        authToken.value = null;
        guestToken.value = null;
        player.value = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('guest_token');
    }

    return {
        authToken,
        guestToken,
        player,

        isAuthenticated,
        hasGuestAccess,
        isIdentityLoaded,

        setAuthToken,
        setGuestToken,
        setPlayerProfile,

        clearGuestToken,
        clearIdentity,
    }
})
