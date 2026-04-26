<template>
  <div class="swift-app" :class="`theme-${mode}`" style="height: 100vh;">
    <div class="swift-shell">
      <SideNav />
      <div class="swift-main">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SideNav from './SideNav.vue';
import { useTheme } from '../composables/useTheme';

const { mode } = useTheme();
</script>
