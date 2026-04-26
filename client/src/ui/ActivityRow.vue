<template>
  <div class="ar">
    <span class="ar__time">{{ relativeTime }}</span>
    <div class="ar__body">
      <span class="ar__actor">{{ actor }}</span>
      <span class="ar__verb">{{ verb }}</span>
      <span v-if="target" class="ar__target">· {{ target }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  actor: string;
  verb: string;
  target?: string;
  timestamp: string | Date | number;
}>();

const relativeTime = computed(() => {
  const t = typeof props.timestamp === 'object' ? props.timestamp.getTime() : new Date(props.timestamp).getTime();
  const diff = Math.max(0, Date.now() - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(t).toISOString().slice(0, 10);
});
</script>

<style scoped>
.ar {
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 11px;
}
.ar__time {
  font-family: var(--font-mono);
  color: var(--text-4);
  font-size: 10px;
  width: 56px;
  flex-shrink: 0;
}
.ar__body { min-width: 0; }
.ar__actor { color: var(--text-1); }
.ar__verb { color: var(--text-3); margin-left: 4px; }
.ar__target { color: var(--text-3); margin-left: 4px; }
</style>
