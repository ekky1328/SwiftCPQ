<template>
  <div style="display: flex; gap: 8px; align-items: center">
    <button
      v-for="(colors, name) in ACCENTS"
      :key="name"
      :title="name"
      :style="{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: colors.dark,
        border: modelValue === name ? `2px solid ${colors.dark}` : '2px solid var(--border)',
        outline: modelValue === name ? `2px solid ${colors.dark}` : 'none',
        outlineOffset: '2px',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'outline 0.1s',
      }"
      @click="emit('update:modelValue', name as ThemeAccent)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ThemeAccent } from '../composables/useTheme';

const ACCENTS: Record<ThemeAccent, { dark: string }> = {
  amber:  { dark: 'oklch(0.80 0.15 78)' },
  indigo: { dark: 'oklch(0.72 0.16 265)' },
  violet: { dark: 'oklch(0.74 0.16 300)' },
  green:  { dark: 'oklch(0.78 0.16 155)' },
  red:    { dark: 'oklch(0.72 0.18 25)' },
};

defineProps<{ modelValue: ThemeAccent }>();
const emit = defineEmits<{ 'update:modelValue': [ThemeAccent] }>();
</script>
