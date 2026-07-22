// src/stores/identity.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { playerService } from '@/services/playerService';
import type { Player } from '@/types/models';
import { api } from '@/services/api';

export const useIdentityStore = defineStore('identity', () => {
    const authenticatedPlayerId = ref<string | null>(localStorage.getItem('auth_player_id'));
    const guestToken = ref<string | null>(localStorage.getItem('guest_token'));
    const player = ref<Player | null>(null);

    const isAuthenticated = computed<boolean>(() => !!authenticatedPlayerId.value);
    const hasGuestAccess = computed<boolean>(() => !!guestToken.value);

    function login(playerId: string, profile: PlayerProfile) {
        authenticatedPlayerId.value = playerId;
        localStorage.setItem('auth_player_id', playerId);
        player.value = profile;
        clearGuestToken();
    }

    function setGuestToken(token: string) {
        guestToken.value = token;
        localStorage.setItem('guest_token', token);
    }

    function clearGuestToken() {
        guestToken.value = null;
        localStorage.removeItem('guest_token');
    }

    function clearIdentity() {
        authenticatedPlayerId.value = null;
        guestToken.value = null;
        player.value = null;
        localStorage.removeItem('auth_player_id');
        localStorage.removeItem('guest_token');
    }

    async function checkSessionLifeCycle() {
        try {
            const response = await api.get('/auth/profile/');
            if (response.data.isAuthenticated) {
                authenticatedPlayerId.value = response.data.id;
                localStorage.setItem('auth_player_id', response.data.id);
                player.value = {
                    id: response.data.id,
                    is_guest: false,
                    display_name: response.data.display_name,
                } as Player;
            }
            else {
                if (!guestToken.value) {
                    const data = await playerService.createGuestPlayer();
                    setGuestToken(data.guest_token);
                }
            }
        }
        catch {
            clearIdentity();
            try {
                const data = await playerService.createGuestPlayer();
                setGuestToken(data.guest_token);
            }
            catch (e) {
                console.error("Failed to generate backend guest token", e);
            }
        }
    }

    return {
        authenticatedPlayerId,
        guestToken,
        player,

        isAuthenticated,
        hasGuestAccess,

        login,
        setGuestToken,

        clearGuestToken,
        clearIdentity,

        checkSessionLifeCycle,
    }
})
