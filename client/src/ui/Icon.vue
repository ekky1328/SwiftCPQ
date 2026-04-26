<template>
  <span :class="['ico', cls]">{{ glyph }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  cls?: string;
}>();

const MAP: Record<string, string> = {
  home: '◇',
  catalogue: '▦',
  customers: '◔',
  suppliers: '▼',
  users: '◐',
  roles: '◈',
  settings: '⚙',
  tenants: '⌬',
  search: '⌕',
  plus: '+',
  chevron: '›',
  sort: '↕',
  sortUp: '↑',
  sortDown: '↓',
  drag: '⋮⋮',
  eye: '◉',
  lock: '▢',
  pencil: '✎',
  trash: '✕',
  duplicate: '❏',
  history: '↺',
  download: '↓',
  save: '✓',
  bolt: '⚡',
  kebab: '⋯',
  dot: '•',
  arrowRight: '→',
  filter: '▽',
  columns: '▥',
  db: '▤',
  branch: '⎇',
  signOut: '⎋',
  microsoft: '⊞',
};

const glyph = computed(() => MAP[props.name] ?? props.name);
</script>
