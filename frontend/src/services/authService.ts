// src/services/authService.ts

import { api } from './api';

export interface LoginResponse {
    status: string;
    uuid: string;
    token?: string;
    new_account?: boolean;
}

export const authService = {
    async signInWithGoogle(credentialToken: string, linkToken?: string | null): Promise<LoginResponse> {
        const payload: any = { id_token: credentialToken };
        if (linkToken) payload.link_token = linkToken;

        const response = await api.post<LoginResponse>('/auth/google/', payload)
        return response.data;
    },

    async loginWithCredentials(username: string, password: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login/', {
            username,
            password
        })
        return response.data;
    },

    async signupWithCredentials(username: string, password: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/signup/', {
            username,
            password,
        });
        return response.data;
    },

    async logout(): Promise<void> {
        const response = await api.post('/auth/logout/');
        return response.data;
    },

    async deleteAccount(): Promise<void> {
        const response = await api.delete('/auth/delete/');
        return response.data;
    },
};
