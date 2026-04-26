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
import { RouterView } from 'vue-router';
import ConfirmDialog from 'primevue/confirmdialog';
import { useAuthStore } from './store/authStore';
import { useTheme } from './composables/useTheme';
import AppShell from './ui/AppShell.vue';

const auth = useAuthStore();
const { mode } = useTheme();
</script>

