<template>
  <div class="swift-topbar">
    <div class="swift-crumb">
      <template v-for="(c, i) in crumbs" :key="i">
        <span v-if="i > 0" class="sep">/</span>
        <span :class="{ current: i === crumbs.length - 1 }">{{ c }}</span>
      </template>
    </div>
    <div class="swift-topbar__spacer" />
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  crumbs: string[];
}>();
</script>
