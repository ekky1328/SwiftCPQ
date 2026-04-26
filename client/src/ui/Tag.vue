<template>
  <span :class="cls"><slot /></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  kind?: 'success' | 'warn' | 'error' | 'info' | 'accent';
  dot?: boolean;
}>();

const cls = computed(() => [
  'swift-tag',
  props.kind ? `swift-tag--${props.kind}` : '',
  props.dot ? 'swift-tag--dot' : '',
].filter(Boolean).join(' '));
</script>
