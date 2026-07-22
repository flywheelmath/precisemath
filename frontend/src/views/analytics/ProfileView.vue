<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router'
import { apiClient } from '@schoolpanel/auth';
import { getGroupedSkills, type Category } from '@/lib/skills/registry';
import { useAuthStore } from '@schoolpanel/auth';

interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string;
  is_student: boolean;
}

const user = ref<UserProfile | null>(null);
const editableUser = ref<Partial<UserProfile>>({});
const categories = ref<Category[]>([]);
const isEditing = ref(false);
const serverError = ref<Record<string, string[]>>({});

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  try {
    const response = await apiClient.get<UserProfile>('/api/profile/');
    user.value = response.data;
    categories.value = getGroupedSkills();
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
  }
});

const startEditing = () => {
    if (user.value) {
        editableUser.value = { ...user.value };
        isEditing.value = true;
    }
};

const cancelEdit = () => {
    isEditing.value = false;
    editableUser.value = {};
    serverError.value = {};
};

const saveProfile = async () => {
    serverError.value = {};
    try {
        const response = await apiClient.patch<UserProfile>('/api/profile/', editableUser.value);
        user.value = response.data;
        isEditing.value = false;
    } catch (error: any) {
        if (error.response && error.response.status === 400) {
            serverError.value = error.response.data;
        } else {
            console.error("Failed to update profile:", error);
        }
    }
};

const deleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        try {
            await apiClient.delete('/api/profile/');
            authStore.logout();
            alert('Your account has been successfully deleted.');
        } catch (error) {
            console.error("Failed to delete account:", error);
            alert('There was an error deleting your account.');
        }
    }
};
</script>

<template>
    <div class="profile-container">
        <h1>User Profile</h1>
        <div v-if="user" class="profile-section">
            <h2>Account Information</h2>

            <form v-if="isEditing" @submit.prevent="saveProfile" class="edit-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input id="username" v-model="editableUser.username" type="text" />
                    <div v-if="serverError.username" class="error-message" type="text">{{ serverError.username }}</div>
                </div>
                <div class="form-group">
                    <label for="displayName">Display name</label>
                    <input id="displayName" v-model="editableUser.display_name" type="text" />
                    <div v-if="serverError.displayName" class="error-message" type="text" >{{ serverError.displayName }}</div>
                </div>
                <p><strong>Username:</strong> {{ user.username }}</p>
                <div class="form-actions">
                    <button type="submit" class="button-primar">Save</button>
                    <button type="button" @click="cancelEdit">Cancel</button>
                </div>
            </form>

            <div v-else>
                <p><strong>Username:</strong> {{ user.username }}</p>
                <p><strong>Display name:</strong> {{ user.display_name }}</p>
                <p><strong>Email:</strong> {{ user.email }}</p>
                <div class="profile-actions">
                    <button @click="startEditing">Edit profile</button>
                    <RouterLink to="/password-reset">Change password</RouterLink>
                    <button
                        v-if="user && !user.is_student"
                        class="button-danger"
                        @click="deleteAccount"
                    >
                        Delete account
                    </button>
                </div>
            </div>
      </div>

    <div class="profile-section">
      <h2>Performance Profiles</h2>
      <div v-for="category in categories" :key="category.name" class="category-column">
        <h3 class="category-title">{{ category.name }}</h3>
        <nav class="skill-nav">
          <RouterLink
            v-for="skill in category.skills"
            :key="skill.path"
            :to="`/profile/${skill.path}`"
            class="skill-link"
          >
            {{ skill.displayName }}
          </RouterLink>
        </nav>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 2rem auto;
}
.profile-section {
  background-color: var(--color-ui-surface-soft);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  color: var(--color-ui-text-primary);
}
.edit-form .form-group {
  margin-bottom: 1rem;
}
.edit-form label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-ui-text-secondary);
}
.edit-form input {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  background-color: var(--color-ui-input-bg);
  color: var(--color-ui-text-primary);
  border: 1px solid var(--color-ui-border);
  border-radius: 4px;
}
.form-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}
button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-ui-border);
  cursor: pointer;
  background-color: var(--color-ui-button-bg);
  color: var(--color-ui-button-text);
  transition: background-color 0.2s;
}
button:hover {
    background-color: var(--color-ui-button-hover);
}
.button-primary {
  background-color: var(--color-ui-primary);
  color: var(--color-ui-text-inverse);
  border-color: var(--color-ui-primary);
}
.button-primary:hover {
    background-color: var(--color-ui-primary-hover);
}
.button-danger {
  background-color: var(--color-ui-danger);
  color: var(--color-ui-text-inverse);
  border-color: var(--color-ui-danger);
}
.button-danger:hover {
    background-color: var(--color-ui-danger-hover);
}
.profile-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}
.error-message {
    color: var(--color-ui-danger);
    font-size: 0.9rem;
    margin-top: 0.25rem;
}
.category-column {
  margin-top: 1rem;
}
.category-title {
  margin-bottom: 1rem;
  color: var(--color-ui-text-primary);
}
.skill-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.skill-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    text-decoration: none;
    background-color: var(--color-ui-primary);
    color: var(--color-ui-text-inverse);
    border-radius: 8px;
    transition: background-color 0.2s;
}
.skill-link:hover {
    background-color: var(--color-ui-primary-hover);
}
</style>
