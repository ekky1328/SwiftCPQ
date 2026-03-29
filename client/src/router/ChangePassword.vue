<template>
  <main>
    <div class="login-card">
      <div class="login-header">
        <span class="logo">⚡</span>
        <h1>Change Password</h1>
      </div>

      <p v-if="auth.user?.forcePasswordReset" class="text-sm text-gray-600 mb-4">
        Your password must be changed before you can continue.
      </p>

      <form @submit.prevent="handleChangePassword" class="login-form">
        <div class="field">
          <label for="currentPassword">Current Password</label>
          <Password
            id="currentPassword"
            v-model="currentPassword"
            placeholder="Current password"
            :feedback="false"
            :toggle-mask="true"
            :disabled="loading"
            fluid
          />
        </div>
        <div class="field">
          <label for="newPassword">New Password</label>
          <Password
            id="newPassword"
            v-model="newPassword"
            placeholder="New password (min 8 characters)"
            :feedback="true"
            :toggle-mask="true"
            :disabled="loading"
            fluid
          />
        </div>
        <div class="field">
          <label for="confirmPassword">Confirm New Password</label>
          <Password
            id="confirmPassword"
            v-model="confirmPassword"
            placeholder="Confirm new password"
            :feedback="false"
            :toggle-mask="true"
            :disabled="loading"
            fluid
          />
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
        <Message v-if="successMessage" severity="success" :closable="false">{{ successMessage }}</Message>

        <Button
          type="submit"
          label="Change Password"
          :loading="loading"
          fluid
        />
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useAuthStore } from '../store/authStore';
import { ChangePassword } from '../api/api';

const router = useRouter();
const auth = useAuthStore();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function handleChangePassword() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'All fields are required';
    return;
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New passwords do not match';
    return;
  }

  loading.value = true;
  try {
    const result = await ChangePassword(currentPassword.value, newPassword.value);
    if (result) {
      successMessage.value = 'Password changed successfully. Redirecting...';
      await auth.initialize();
      setTimeout(() => router.replace('/'), 1000);
    } else {
      errorMessage.value = 'Failed to change password. Check your current password.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
main {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background-color: #ebeef0;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.login-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.logo {
  font-size: 2rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
</style>
