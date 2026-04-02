<template>
  <main>
    <div class="login-card">
      <div class="login-header">
        <span class="logo">⚡</span>
        <h1>SwiftCPQ</h1>
      </div>

      <form v-if="authMethods?.local" @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="username">Username</label>
          <InputText
            id="username"
            v-model="username"
            placeholder="Username"
            autocomplete="username"
            :disabled="loading"
            fluid
          />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="password"
            placeholder="Password"
            :feedback="false"
            :toggle-mask="true"
            autocomplete="current-password"
            :disabled="loading"
            fluid
          />
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

        <Button
          type="submit"
          label="Sign in"
          :loading="loading"
          fluid
        />
      </form>

      <div v-if="authMethods?.local && authMethods?.entra" class="divider">
        <span>or</span>
      </div>

      <Button
        v-if="authMethods?.entra"
        label="Sign in with Microsoft"
        severity="secondary"
        icon="pi pi-microsoft"
        fluid
        @click="handleEntraLogin"
      />

      <div v-if="!authMethods" class="loading-state">
        <ProgressSpinner style="width: 32px; height: 32px" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { useAuthStore } from '../store/authStore';

const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const authMethods = ref<AuthConfig | null>(null);

const domain = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';

onMounted(async () => {
  if (auth.user) {
    router.replace('/');
    return;
  }
  try {
    const res = await fetch(`${domain}/api/v1/auth/config`, { credentials: 'include' });
    if (res.ok) authMethods.value = await res.json();
  } catch {
    authMethods.value = { local: true, entra: false, multiTenant: false };
  }
});

async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;
  try {
    const err = await auth.login(username.value, password.value);
    if (err) {
      errorMessage.value = err;
    } else {
      router.replace('/');
    }
  } finally {
    loading.value = false;
  }
}

function handleEntraLogin() {
  window.location.href = `${domain}/api/v1/auth/entra/redirect`;
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

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.25rem 0;
  color: #9ca3af;
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 2rem;
}
</style>
