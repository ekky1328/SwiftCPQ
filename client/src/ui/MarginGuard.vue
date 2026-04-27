<template>
  <div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px">
      <span style="color: var(--text-3)">{{ label }}</span>
      <span class="mono" style="color: var(--text-1); font-weight: 600">{{ value }}%</span>
    </div>
    <div style="height: 6px; background: var(--surface-100); border-radius: 3px; position: relative; overflow: hidden">
      <div :style="{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fillPct + '%', background: fillColor }" />
      <div :style="{ position: 'absolute', left: targetPct + '%', top: '-2px', bottom: '-2px', width: '1px', background: 'var(--text-2)' }" />
      <div :style="{ position: 'absolute', left: ceilingPct + '%', top: '-2px', bottom: '-2px', width: '1px', background: 'var(--text-3)' }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label?: string;
  value: number;
  target?: number;
  ceiling?: number;
  max?: number;
}>();

const max = computed(() => props.max ?? 50);

const fillPct = computed(() => Math.min(100, (props.value / max.value) * 100));
const targetPct = computed(() => props.target != null ? (props.target / max.value) * 100 : null);
const ceilingPct = computed(() => props.ceiling != null ? (props.ceiling / max.value) * 100 : null);

const fillColor = computed(() => {
  if (props.target != null && props.value < props.target) return 'var(--warn)';
  if (props.ceiling != null && props.value > props.ceiling) return 'var(--error)';
  return 'var(--success)';
});
</script>
