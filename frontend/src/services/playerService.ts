import { api } from './api';

export const playerService = {
    async createGuestPlayer() {
        const response = await api.post('/player/guest/');
        return response.data;
    },
};
