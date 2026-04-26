<template>
  <div class="swift-stat" :class="{ 'swift-stat--bold': bold, 'swift-stat--align-end': align === 'end' }">
    <span class="swift-stat__label">{{ label }}</span>
    <span class="swift-stat__value" :class="toneClass">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  label: string;
  value: string | number;
  tone?: 'success' | 'warn' | 'error' | 'info';
  bold?: boolean;
  align?: 'start' | 'end';
}>(), {
  align: 'end',
});

const toneClass = computed(() =>
  props.tone ? `swift-stat__value--${props.tone}` : ''
);
</script>

<style scoped>
.swift-stat {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  align-items: flex-end;
}
.swift-stat--align-end { align-items: flex-end; }
.swift-stat:not(.swift-stat--align-end) { align-items: flex-start; }

.swift-stat__label {
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.swift-stat__value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-1);
}
.swift-stat--bold .swift-stat__value {
  font-size: 14px;
  font-weight: 600;
}
.swift-stat__value--success { color: var(--success); }
.swift-stat__value--warn { color: var(--warn); }
.swift-stat__value--error { color: var(--error); }
.swift-stat__value--info { color: var(--info); }
</style>
