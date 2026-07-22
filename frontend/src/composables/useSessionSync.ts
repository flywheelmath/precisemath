import { ref } from 'vue';
import type { SessionPayload } from '@/types';

export function useSessionSync() {
    const sessionId = ref<string | null>(null);
    const syncInterval = ref<number | null>(null);
    const isSyncing = ref(false);

    async function executeSync(
        payload: SessionPayload,
        submitFn: (payload: SessionPayload) => Promise<any>
    ) {
        if (isSyncing.value) return;
        isSyncing.value = true;

        try {
            if (sessionId.value) payload.session_id = sessionId.value;

            const response = await submitFn(payload);

            if (response && response.data?.session_id) {
                sessionId.value = response.data.session_id;
            }
            else if (typeof response === 'string') {
                sessionId.value = response;
            }
        }
        catch (error) {
            console.error("Auto-sync failed:", error);
        }
        finally {
            isSyncing.value = false;
        }
    }

    function startAutoSync(
        payloadFactory: () => SessionPayload | null,
        submitFn: (payload: SessionPayload) => Promise<any>,
        intervalMs = 15000,
    ) {
        stopAutoSync();
        syncInterval.value = window.setInterval(() => {
            const payload = payloadFactory();
            if (payload) executeSync(payload, submitFn);
        }, intervalMs);
    }

    function stopAutoSync() {
        if (syncInterval.value) {
            clearInterval(syncInterval.value);
            syncInterval.value = null;
        }
    }

    function resetSyncState() {
        stopAutoSync();
        sessionId.value = undefined;
    }

    return {
        sessionId,
        isSyncing,

        executeSync,
        startAutoSync,
        stopAutoSync,
        resetSyncState,
    };
}
