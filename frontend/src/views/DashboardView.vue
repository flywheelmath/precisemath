<script setup lang="ts">
import { useIdentityStore } from '@/stores/identity';
import { useAuthStore } from '@/stores/auth';
import LogOutButton from '@/components/auth/LogOutButton.vue';
import PseudonymDisplay from '@/components/auth/PseudonymDisplay.vue';

const identityStore = useIdentityStore();
const authStore = useAuthStore();
</script>

<template>
  <div class="dashboard-wrapper">
    <header class="dashboard-navbar">
      <div class="brand">
        <h2>PreciseMath</h2>
      </div>
      
      <div class="user-menu">
        <div class="user-info">
          <PseudonymDisplay />

          <span v-if="identityStore.isGuest" class="guest-badge">Guest</span>
          <span v-if="identityStore.pin" class="pin-badge">PIN: {{ identityStore.pin }}</span>
        </div>
        
        <LogOutButton />
      </div>
    </header>

    <main class="dashboard-content">
      <div class="welcome-card">
        <h3>Welcome to the Dashboard</h3>
        <p>You have successfully authenticated. This page is protected by your Vue Router navigation guards.</p>
        
        <div class="status-box">
          <p><strong>Identity Status:</strong></p>
          <ul>
            <li><strong>ID:</strong> {{ identityStore.id }}</li>
            <li><strong>Account Type:</strong> {{ identityStore.isGuest ? 'Anonymous Guest' : 'Registered User' }}</li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  min-height: 100vh;
  background-color: #f6f8fa;
  font-family: inherit;
}

.dashboard-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e4e8;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.brand h2 {
  margin: 0;
  color: #24292e;
  font-size: 1.5rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #24292e;
  font-weight: 500;
}

.guest-badge {
  background-color: #ffdce0;
  color: #cb2431;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}

.pin-badge {
  background-color: #f1f8ff;
  color: #0366d6;
  border: 1px solid #c8e1ff;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
}

.dashboard-content {
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.welcome-card h3 {
  margin-top: 0;
  color: #24292e;
}

.status-box {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-left: 4px solid #0366d6;
  border-radius: 4px;
}

.status-box ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  color: #586069;
}
</style>
