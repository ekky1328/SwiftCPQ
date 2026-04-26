<template>
  <div :style="rowStyle">
    <span class="swift-status-dot" :style="{ background: dotColor, flexShrink: 0 }" />
    <span style="flex: 1; color: var(--text-2)">{{ label }}</span>
    <button v-if="cta" class="swift-btn swift-btn--ghost" style="font-size: 11px; padding: 0 6px; height: 20px; flex-shrink: 0" @click="emit('action')">
      {{ cta }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  kind: 'pass' | 'warn' | 'error';
  label: string;
  cta?: string;
}>();

const emit = defineEmits<{ action: [] }>();

const dotColor = computed(() => {
  if (props.kind === 'pass') return 'var(--success)';
  if (props.kind === 'warn') return 'var(--warn)';
  return 'var(--error)';
});

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 12px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: '12px',
};
</script>
