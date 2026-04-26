<template>
  <div
    class="oni"
    :class="{ 'oni--active': active }"
    @click="$emit('click')"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <span v-if="active" class="oni__rail" />
    <span
      class="oni__drag"
      :class="{ 'oni__drag--locked': locked, 'oni__drag--visible': hover || active }"
      :title="locked ? 'Section is locked' : 'Drag to reorder'"
      @click.stop
    >⋮⋮</span>
    <span class="oni__index">{{ String(index).padStart(2, '0') }}</span>
    <span class="oni__title">{{ title }}</span>
    <span v-if="recurring" class="oni__recurring" title="Recurring">↻</span>
    <span v-if="itemCount && itemCount > 0 && !hover && !locked" class="oni__count">{{ itemCount }}</span>
    <button
      class="oni__lock"
      :class="{ 'oni__lock--locked': locked, 'oni__lock--visible': hover || locked }"
      :title="locked ? 'Locked — click to unlock' : 'Lock section in place'"
      @click.stop="$emit('lock-toggle')"
    >{{ locked ? '▣' : '▢' }}</button>
    <span class="oni__type-dot" :style="{ background: typeColor }" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
  index: number;
  title: string;
  type: string;
  itemCount?: number;
  locked?: boolean;
  optional?: boolean;
  recurring?: boolean;
  active?: boolean;
}>(), {
  locked: false,
  optional: false,
  recurring: false,
  active: false,
});

defineEmits<{
  (e: 'click'): void;
  (e: 'lock-toggle'): void;
}>();

const hover = ref(false);

const typeColor = computed(() => {
  switch (props.type) {
    case 'INFO':
    case 'COVER_LETTER':
    case 'TERMS_AND_CONDITIONS':
      return 'var(--text-3)';
    case 'PRODUCTS':
      return 'var(--accent)';
    case 'MILESTONES':
      return 'var(--info)';
    case 'TOTALS':
      return 'var(--success)';
    default:
      return 'var(--text-3)';
  }
});
</script>

<style scoped>
.oni {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px 5px 2px;
  margin: 0 0 1px;
  border-radius: var(--r-md);
  cursor: pointer;
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
  position: relative;
}
.oni:hover { background: var(--surface-100); }
.oni--active {
  background: var(--surface-200);
  color: var(--text-1);
}

.oni__rail {
  position: absolute;
  left: -6px;
  width: 2px;
  height: 14px;
  background: var(--accent);
  border-radius: 1px;
}

.oni__drag {
  width: 12px;
  text-align: center;
  color: var(--text-4);
  font-size: 10px;
  cursor: grab;
  opacity: 0.4;
  user-select: none;
  font-family: var(--font-mono);
  letter-spacing: -1px;
  transition: opacity 100ms;
}
.oni__drag--visible { opacity: 1; }
.oni__drag--locked { cursor: not-allowed; opacity: 0.3; }

.oni__index {
  font-family: var(--font-mono);
  color: var(--text-4);
  font-size: 10px;
  width: 16px;
}

.oni__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oni__recurring {
  font-size: 9px;
  color: var(--info);
}

.oni__count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-4);
}

.oni__lock {
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-4);
  opacity: 0;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  display: grid;
  place-content: center;
  transition: opacity 100ms;
}
.oni__lock--visible { opacity: 1; }
.oni__lock--locked { color: var(--accent); opacity: 1; }

.oni__type-dot {
  width: 4px;
  height: 4px;
  border-radius: 2px;
  opacity: 0.7;
}
</style>
