<template>
  <button style="background: transparent; border: none; padding: 0; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 4px; width: 100%" @click="emit('click')">
    <div :style="{
      aspectRatio: '1 / 1.414',
      background: 'white',
      border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      padding: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      overflow: 'hidden',
    }">
      <slot>
        <!-- default: blank page lines -->
        <div v-for="i in 6" :key="i" style="height: 3px; background: #e5e7eb; border-radius: 1px; width: 100%" :style="{ width: i === 1 ? '60%' : '100%' }" />
      </slot>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 10px">
      <span class="mono" style="color: var(--text-3)">{{ String(pageNumber).padStart(2, '0') }}</span>
      <span :style="{ color: active ? 'var(--text-1)' : 'var(--text-3)' }">{{ label }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  pageNumber: number;
  label?: string;
  active?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();
</script>
