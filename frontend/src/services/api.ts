import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

import { useIdentityStore } from '@/stores/identity';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
})

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const identityStore = useIdentityStore()

        if (identityStore.playerToken) {
            config.headers['X-Player-Token'] = identityStore.playerToken;
        }

        return config;
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        const identityStore = useIdentityStore()

        if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
            identityStore.clearIdentity()
        }

        return Promise.reject(error);
    }
)
