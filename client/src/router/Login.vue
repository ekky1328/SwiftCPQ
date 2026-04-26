<template>
  <div class="swift-app" :class="`theme-${mode}`" style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center">
    <div style="width: 360px; display: flex; flex-direction: column; gap: 20px">

      <!-- Brand -->
      <div style="text-align: center; padding-bottom: 4px">
        <div style="font-size: 22px; font-weight: 600; color: var(--text-1)">⚡ SwiftCPQ</div>
        <div style="font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px">Sign in to your workspace</div>
      </div>

      <!-- Loading config probe -->
      <div v-if="!authMethods" style="display: flex; justify-content: center; padding: 16px">
        <span class="spinner" />
      </div>

      <template v-else>
        <!-- Error -->
        <Tag v-if="errorMessage" kind="error" style="width: 100%; justify-content: center">{{ errorMessage }}</Tag>

        <!-- Local form -->
        <template v-if="authMethods.local">
          <input
            ref="usernameInput"
            class="swift-input"
            v-model="username"
            placeholder="Username"
            autocomplete="username"
            :disabled="loading"
            style="width: 100%"
          />
          <input
            class="swift-input"
            type="password"
            v-model="password"
            placeholder="Password"
            autocomplete="current-password"
            :disabled="loading"
            style="width: 100%"
            @keyup.enter="handleLogin"
          />
          <Btn variant="primary" style="width: 100%; justify-content: center" :disabled="loading" @click="handleLogin">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </Btn>
        </template>

        <!-- Divider -->
        <div v-if="authMethods.local && authMethods.entra" style="display: flex; align-items: center; gap: 8px; color: var(--text-3)">
          <div style="flex: 1; height: 1px; background: var(--border)" />
          <span class="mono" style="font-size: 10px">OR</span>
          <div style="flex: 1; height: 1px; background: var(--border)" />
        </div>

        <!-- Entra -->
        <Btn v-if="authMethods.entra" style="width: 100%; justify-content: center; gap: 6px" @click="handleEntraLogin">
          <Icon name="microsoft" />
          Continue with Microsoft
        </Btn>

        <!-- Dev quickfill -->
        <template v-if="isDev">
          <div style="display: flex; align-items: center; gap: 6px">
            <Tag kind="warn" style="font-size: 10px">Dev</Tag>
            <span style="font-size: 11px; color: var(--text-3)">Quick login</span>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap">
            <button
              v-for="u in DEV_USERS"
              :key="u.label"
              class="swift-btn"
              style="font-size: 11px"
              @click="quickLogin(u)"
            >{{ u.label }}</button>
          </div>
        </template>
      </template>
    </div>

    <!-- Status footer -->
    <div style="position: fixed; bottom: 0; left: 0; right: 0">
      <StatusBar>
        <span><span class="swift-status-dot" style="background: var(--info)" />&nbsp;login</span>
      </StatusBar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../composables/useTheme';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import Icon from '../ui/Icon.vue';
import StatusBar from '../ui/StatusBar.vue';

interface AuthConfig { local: boolean; entra: boolean; multiTenant: boolean }

const router = useRouter();
const auth = useAuthStore();
const { mode } = useTheme();

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const authMethods = ref<AuthConfig | null>(null);
const usernameInput = ref<HTMLInputElement | null>(null);

const isDev = import.meta.env.DEV;
const DEV_USERS = [
  { label: 'Michael Scott (admin)', username: 'm.scott@dundermifflin.com',  password: 'Dunder_M1fflin_$ux!' },
  { label: 'Dwight Schrute',        username: 'd.schrute@dundermifflin.com', password: 'Dunder_M1fflin_Rule$!' },
];

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
  await nextTick();
  usernameInput.value?.focus();
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

function quickLogin(u: { username: string; password: string }) {
  username.value = u.username;
  password.value = u.password;
  handleLogin();
}
</script>

<style scoped>
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
