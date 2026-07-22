// src/stores/identity.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { api } from '@/services/api';
import { playerService } from '@/services/playerService';
import type { Player } from '@/types/models';

export const useIdentityStore = defineStore('identity', () => {
    const authenticatedPlayerId = ref<string | null>(localStorage.getItem('auth_player_id'));
    const guestToken = ref<string | null>(localStorage.getItem('guest_token'));
    const player = ref<Player | null>(null);

    const isAuthenticated = computed<boolean>(() => !!authenticatedPlayerId.value);
    const isPlayer = computed<boolean>(() => !!player.value);

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

    async function commitGuestPlayer() {
        try {
            const data = await playerService.createGuestPlayer();
            guestToken.value = data.guest_token;
            localStorage.setItem('guest_token', data.guest_token);
            player.value = {
                id: data.id,
                is_guest: true,
                display_name: data.display_name,
                pin: data.pin
            };
        }
        catch (e) {
            console.error("Failed to initialize guest profile on backend", e);
            throw e;
        }
    }

    function clearIdentity() {
        authenticatedPlayerId.value = null;
        guestToken.value = null;
        player.value = null;
        localStorage.removeItem('auth_player_id');
        localStorage.removeItem('guest_token');
    }

    async function checkSessionLifeCycle() {
        const userId = localStorage.getItem('auth_player_id');
        const guestId = localStorage.getItem('guest_token');

        if (!userId && !guestId) {
            clearIdentity();
            return;
        }

        try {
            const headers = {};
            if (userId) {
                headers['X-User-Identifier'] = userId;
            } else if (guestId) {
                headers['X-Guest-Identifier'] = guestId;
            }

            const response = await api.get('/sessions/player/', { headers: headers });

            player.value = {
                id: response.data.id,
                is_guest: response.data.is_guest,
                display_name: response.data.display_name,
                pin: response.data.pin,
            } as Player;

            if (!response.data.is_guest) {
                authenticatedPlayerId.value = response.data.id;
                localStorage.setItem('auth_player_id', response.data.id);
                clearGuestToken();
            }
            else {
                guestToken.value = response.data.id;
                localStorage.setItem('guest_token', response.data.id);
            }
        }
        catch (e) {
            console.error("Profile synchronization mapping failed:", e);
            clearIdentity();
        }
    }

    return {
        authenticatedPlayerId,
        guestToken,
        player,

        isAuthenticated,
        isPlayer,

        login,
        setGuestToken,
        commitGuestPlayer,

        clearGuestToken,
        clearIdentity,

        checkSessionLifeCycle,
    }
})
