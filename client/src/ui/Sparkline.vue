<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    style="display: block"
  >
    <polyline
      :points="points"
      fill="none"
      stroke="var(--accent)"
      stroke-width="1.5"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  values: number[];
  width?: number;
  height?: number;
}>();

const width = computed(() => props.width ?? 280);
const height = computed(() => props.height ?? 40);

const points = computed(() => {
  const vals = props.values;
  if (vals.length < 2) return '';
  const w = width.value;
  const h = height.value;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * (w - 4) + 2;
      const y = h - 2 - ((v - min) / range) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});
</script>
