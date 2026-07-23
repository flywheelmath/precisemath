// src/stores/identity.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { api } from '@/services/api';
import type { Player } from '@/types';

export const useIdentityStore = defineStore('identity', () => {
    const playerToken = ref<string | null>(localStorage.getItem('player_token'));
    const cachedPlayer = localStorage.getItem('cached_player_profile');
    const player = ref<Player | null>(cachedPlayer ? JSON.parse(cachedPlayer) : null);

    const hasIdentity = computed<boolean>(() => !!playerToken.value);
    const isAuthenticated = computed<boolean>(() => !!playerToken.value && !!player.value && !player.value?.is_guest);
    const isPlayer = computed<boolean>(() => !!player.value);

    function login(token: string, profile: Player) {
        console.log(profile);
        playerToken.value = token;
        localStorage.setItem('player_token', token);
        player.value = profile
    }

    function clearIdentity() {
        playerToken.value = null;
        player.value = null;
        localStorage.removeItem('player_token');
        localStorage.removeItem('cached_player_profile');
    }

    async function initializeGuestPlayer() {
        try {
            const response = await api.post<Player>('/engine/player/');
            login(response.data.id, response.data);
        }
        catch (e) {
            console.error("Failed to initialize guest profile on backend", e);
            throw e;
        }
    }

    async function fetchCurrentPlayer() {
        if (!playerToken.value) {
            clearIdentity();
            return;
        }

        if (player.value && !player.value.is_guest) return;

        try {
            const response = await api.get<Player>('/engine/player/');
            login(response.data.id, response.data);

            localStorage.setItem('cached_player_profile', JSON.stringify(response.data));
        }
        catch (e) {
            console.error("Profile synchronization mapping failed:", e);
            clearIdentity();
        }
    }

    return {
        playerToken,
        player,

        hasIdentity,
        isAuthenticated,
        isPlayer,

        login,
        clearIdentity,

        initializeGuestPlayer,
        fetchCurrentPlayer,
    }
})
