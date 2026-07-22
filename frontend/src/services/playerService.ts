import { api } from './api';
import type { Player } from '@/types';

export const playerService = {
    async provisionGuestPlayer(uuid: string, displayName: string) {
        const response = await api.post<Player>('/engine/player/');
        return response.data;
    },
};
