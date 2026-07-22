<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useSessionStore } from '@/stores/session';
import { useAuthStore } from '@schoolpanel/auth';
import { analyzeSession } from '@/lib/session/analytics';
import { getLayoutComponent } from '@/lib/layouts/registry';
import { useInteractionConfig } from '@/composables/useInteractionConfig';

import FeedbackDisplay from '@/components/FeedbackDisplay.vue';
import SessionReportDisplay from '@/components/SessionReportDisplay.vue';

const props = defineProps({
    categorySlug: { type: String, required: true },
    skillSlug: { type: String, required: true },
});

const sessionStore = useSessionStore();
const authStore = useAuthStore();

const { activeLayout: layoutName } = useInteractionConfig(
    computed(() => sessionStore.categorySlug),
    computed(() => sessionStore.skillSlug),
    computed(() => sessionStore.currentPrompt),
    computed(() => sessionStore.skillLevels),
);

const activeLayoutComponent = computed(() => {
    return getLayoutComponent(layoutName.value); 
});

async function handleSubmit(userResponse: any) {
    await sessionStore.submit(userResponse);
}

onMounted(() => { sessionStore.init(props.categorySlug, props.skillSlug); });

watch(() => [props.categorySlug, props.skillSlug], ([newCat, newSkill]) => {
    if (newCat && newSkill) {
        sessionStore.init(newCat as string, newSkill as string);
    }
});

onUnmounted(() => { sessionStore.$reset(); });

const finalReport = computed(() => {
    if (!sessionStore.sessionLog.history.length) return null;
    return analyzeSession(sessionStore.sessionLog, sessionStore.allPrompts);
});
</script>

<template>
    <div class="session-container">
        <div v-if="sessionStore.isLoading">Loading...</div>
        <div v-else-if="sessionStore.error">{{ sessionStore.error }}</div>

        <div v-else-if="!sessionStore.sessionStarted && sessionStore.sessionLog.history.length === 0" class="start-session-container">
            <div v-if="authStore.isAuthenticated">
                <button
                    @click="sessionStore.start()"
                    class="start-button" 
                    autofocus
                >
                    Start
                </button>
            </div>
            <div v-else>
                <input
                    v-model="sessionStore.guestName"
                    type="text"
                    placeholder="Enter your guest name"
                    class="guest-username-input"
                />
                <button
                    @click="sessionStore.start()"
                    class="start-button"
                    autofocus
                >
                    Start guest session
                </button>
                <div class="login-prompt">
                    <RouterLink to="/login">
                        Login
                    </RouterLink>
                        or
                    <RouterLink to="/signup">
                        Sign Up
                    </RouterLink>
                    to save your progress.
                </div>
            </div>
        </div>

        <div v-else-if="!sessionStore.sessionStarted && finalReport">
            <SessionReportDisplay
                :report="finalReport"
                @try-again="sessionStore.restartSession()"
            />
        </div>

        <div v-else-if="sessionStore.currentPrompt" class="active-session-wrapper">
            <component
                :is="activeLayoutComponent" 
                @submit="handleSubmit"
            />
            <FeedbackDisplay
                v-if="sessionStore.feedbackMessage"
                :message="sessionStore.feedbackMessage"
                mode="overlay"
            />
        </div>

        <div v-else>Session Complete!</div>
    </div>
</template>

<style scoped>
.start-session-container {
    text-align: center;
}
.start-button {
    font-size: 1.5rem;
    padding: 15px 40px;
    margin: 10px;
    cursor: pointer;
    border-radius: 8px;
}
.active-session-wrapper {
    position: relative;
    max-width: 1000px;
    margin: auto;
}
.guest-username-input {
  font-size: 1.5rem;
  padding: 10px;
  text-align: center;
  border-radius: 8px;
  border: 1px solid #ccc;
  }
</style>
