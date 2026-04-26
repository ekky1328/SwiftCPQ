<template>
  <button :class="cls" :type="type" v-bind="$attrs">
    <Icon v-if="icon" :name="icon" />
    <slot />
    <span v-if="kbd" class="kbd">{{ kbd }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import Icon from './Icon.vue';

const props = withDefaults(defineProps<{
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  icon?: string;
  kbd?: string;
  type?: 'button' | 'submit' | 'reset';
}>(), {
  variant: 'default',
  type: 'button',
});

const slots = useSlots();

const cls = computed(() => {
  const hasContent = !!slots.default;
  return [
    'swift-btn',
    props.variant !== 'default' ? `swift-btn--${props.variant}` : '',
    !hasContent && props.icon ? 'swift-btn--icon' : '',
  ].filter(Boolean).join(' ');
});

defineOptions({ inheritAttrs: false });
</script>
