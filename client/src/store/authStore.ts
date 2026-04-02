import { defineStore } from 'pinia';
import { ref } from 'vue';
import router from '../router';

const domain = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const authMethods = ref<AuthConfig | null>(null);
  const initialized = ref(false);
  let initPromise: Promise<void> | null = null;

  async function initialize() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const [configRes, meRes] = await Promise.all([
          fetch(`${domain}/api/v1/auth/config`, { credentials: 'include' }),
          fetch(`${domain}/api/v1/auth/me`, { credentials: 'include' }),
        ]);

        if (configRes.ok) {
          authMethods.value = await configRes.json();
        }

        if (meRes.ok) {
          user.value = await meRes.json();
        } else {
          user.value = null;
        }
      } catch {
        user.value = null;
      } finally {
        initialized.value = true;
      }
    })();
    return initPromise;
  }

  async function login(username: string, password: string): Promise<string | null> {
    const res = await fetch(`${domain}/api/v1/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return body.message || 'Login failed';
    }

    const meRes = await fetch(`${domain}/api/v1/auth/me`, { credentials: 'include' });
    if (meRes.ok) {
      user.value = await meRes.json();
    }

    return null;
  }

  function hasPermission(name: string): boolean {
    if (!user.value) return false;
    if (user.value.isSuperAdmin) return true;
    return user.value.permissions.includes(name);
  }

  async function logout() {
    await fetch(`${domain}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    user.value = null;
    router.push('/login');
  }

  return { user, authMethods, initialized, initialize, login, logout, hasPermission };
});
