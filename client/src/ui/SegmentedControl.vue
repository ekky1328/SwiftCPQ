<template>
  <div class="swift-btn-group">
    <button
      v-for="opt in options"
      :key="opt.value"
      :class="['swift-btn', modelValue === opt.value ? 'swift-btn--primary' : '']"
      @click="emit('update:modelValue', opt.value)"
    >{{ opt.label ?? opt.value }}</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { value: string; label?: string }[];
}>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();
</script>
