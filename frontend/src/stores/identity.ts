// src/stores/identity.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { api } from '@/services/api';
import type { Player } from '@/types';

export const useIdentityStore = defineStore('identity', () => {
    const playerToken = ref<string | null>(localStorage.getItem('player_token'));
    const player = ref<Player | null>(null);

    const hasIdentity = computed<boolean>(() => !!playerToken.value);
    const isAuthenticated = computed<boolean>(() => !!playerToken.value && !player.value?.is_guest);
    const isPlayer = computed<boolean>(() => !!player.value);

    function login(token: string, profile: Player) {
        playerToken.value = token
        localStorage.setItem('player_token', token);
        player.value = profile;
    }

    function clearIdentity() {
        playerToken.value = null;
        player.value = null;
        localStorage.removeItem('player_token');
    }

    async function checkSessionLifeCycle() {
        if (!playerToken.value) {
            clearIdentity();
            return;
        }

        try {
            const response = await api.get<Player>('/engine/player/');
            login(response.data.id, response.data);
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

        checkSessionLifeCycle,
    }
})
