<template>
  <template v-if="auth.user">
    <AppShell>
      <RouterView />
    </AppShell>
  </template>
  <template v-else>
    <div class="swift-app" :class="`theme-${mode}`" style="height: 100vh;">
      <RouterView />
    </div>
  </template>
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { RouterView } from 'vue-router';
import ConfirmDialog from 'primevue/confirmdialog';
import { useAuthStore } from './store/authStore';
import { useTheme } from './composables/useTheme';
import { GetSystemSettings } from './api/api';
import AppShell from './ui/AppShell.vue';

const auth = useAuthStore();
const { mode, setTenantDefault } = useTheme();

// Apply tenant accent once after login
watch(() => auth.user, async (user) => {
  if (!user) return;
  const data = await GetSystemSettings();
  if (data?.accent || data?.accentColour) {
    setTenantDefault(data.accent ?? data.accentColour);
  }
}, { immediate: true });
</script>

