<template>
  <div class="swift-statusbar">
    <slot name="left">
      <span><span class="swift-status-dot" :style="{ background: dotColor }" /> &nbsp;{{ status }}</span>
    </slot>
    <slot />
    <div style="flex: 1" />
    <slot name="right">
      <span>⌘K search · ? help</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  status?: string;
  tone?: 'success' | 'warn' | 'error' | 'info';
}>(), {
  status: 'synced',
  tone: 'success',
});

const dotColor = computed(() => `var(--${props.tone})`);
</script>

<style scoped>
.swift-statusbar {
  height: 24px;
  border-top: 1px solid var(--border);
  background: var(--surface-50);
  padding: 0 12px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
</style>
