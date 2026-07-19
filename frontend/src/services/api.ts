import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

import { useIdentityStore } from '@/stores/identity';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const identityStore = useIdentityStore()

        if (identityStore.authToken) {
            config.headers.Authorization = `Bearer ${identityStore.authToken}`
        }
        else if (identityStore.guestToken) {
            config.headers['X-Guest-Token'] = identityStore.guestToken
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response: AxiosResponse) => {
        const identityStore = useIdentityStore()
        const newGuestToken = response.headers['x-guest-token']
        if (newGuestToken) {
            identityStore.setGuestToken(newGuestToken)
        }

        return response
    },
    async (error) => {
        const identityStore = useIdentityStore()
        const originalRequest = error.config

        if ((error.response?.status === 401 || error.response?.status === 404) && !originalRequest._retry) {
            originalRequest._retry = true;

            if (identityStore.guestToken && error.response?.status === 404) {
                identityStore.clearIdentity();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
)
