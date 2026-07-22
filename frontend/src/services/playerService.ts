import { api } from './api';

export const playerService = {
    async createGuestPlayer(uuid: string, displayName: string) {
        const response = await api.post('sessions/player/guest/',{
            uuid,
            display_name: displayName,
        });
        return response.data;
    },
};
