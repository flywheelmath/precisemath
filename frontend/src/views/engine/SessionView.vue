<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useIdentityStore } from '@/stores/identity';
import { useSessionStore } from '@/stores/session';

const identityStore = useIdentityStore();
const sessionStore = useSessionStore();
const router = useRouter();

const isResolvingAuth = ref(true);

onMounted(async () => {
    try {
        await identityStore.fetchCurrentPlayer();
        if (identityStore.isPlayer) {
//            await sessionStore.fetchSessionPrompts();
        }
    } catch (err) {
        console.error("Initialization error handling session parameters:", err);
    } finally {
        isResolvingAuth.value = false;
    }
});

async function handleContinueAsGuest() {
    try {
        await identityStore.initializeGuestPlayer();
//        await sessionStore.fetchSessionPrompts();
    } catch (err) {
        console.error("Failed to execute guest token chaining flow:", err);
    }
}

function handleSignInRedirect() {
    router.push('/signin');
}
</script>

<template>
  <div class="session-container">
    <div v-if="isResolvingAuth" class="loading-overlay">
      <p>Verifying identity metadata...</p>
    </div>

    <div v-else-if="!identityStore.isPlayer" class="start-screen-overlay">
      <div class="start-card">
        <h2>PreciseMath Session Setup</h2>
        <p class="description">Choose how you want to track your progress for this session:</p>
        
        <div class="action-buttons">
          <button @click="handleContinueAsGuest" class="btn-guest">
            Continue as Guest
          </button>
          <div class="or-divider"><span>or</span></div>
          <button @click="handleSignInRedirect" class="btn-signin">
            Sign in with Account
          </button>
        </div>
      </div>
    </div>

    <main v-else class="session-workspace">
      <h3>Active Session: {{ identityStore.player?.display_name }}</h3>
      </main>
  </div>
</template>
