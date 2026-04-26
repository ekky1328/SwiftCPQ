<template>
  <aside
    v-if="open"
    class="rail rail--open"
    :class="`rail--${side}`"
    :style="{ width: width + 'px' }"
  >
    <button
      class="swift-btn swift-btn--ghost swift-btn--icon rail__toggle"
      :title="`Collapse ${label.toLowerCase()}`"
      @click="toggle"
    >{{ side === 'left' ? '‹' : '›' }}</button>
    <header class="rail__header">
      <span class="rail__label">{{ label }}</span>
    </header>
    <div class="rail__body">
      <slot />
    </div>
  </aside>

  <aside
    v-else
    class="rail rail--collapsed"
    :class="`rail--${side}`"
  >
    <button
      class="swift-btn swift-btn--ghost swift-btn--icon"
      :title="`Expand ${label.toLowerCase()}`"
      @click="toggle"
    >{{ side === 'left' ? '›' : '‹' }}</button>
    <div class="rail__vertical-label">{{ label }}</div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  side: 'left' | 'right';
  label: string;
  defaultOpen?: boolean;
  width?: number;
  storageKey?: string;
}>(), {
  defaultOpen: true,
  width: 240,
});

const storageKey = computed(() =>
  props.storageKey ?? `swiftcpq.rail.${props.side}.open`
);

function loadInitial(): boolean {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (raw === null) return props.defaultOpen;
    return raw === '1';
  } catch {
    return props.defaultOpen;
  }
}

const open = ref(loadInitial());

watch(open, (v) => {
  try { localStorage.setItem(storageKey.value, v ? '1' : '0'); } catch { /* ignore */ }
});

function toggle() { open.value = !open.value; }
</script>

<style scoped>
.rail {
  background: var(--surface-50);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}
.rail--collapsed {
  width: 32px;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
}
.rail--left { border-right: 1px solid var(--border); }
.rail--right { border-left: 1px solid var(--border); }

.rail__toggle {
  position: absolute;
  top: 6px;
  width: 22px;
  height: 22px;
  font-size: 12px;
  z-index: 2;
}
.rail--left .rail__toggle { right: 6px; }
.rail--right .rail__toggle { left: 6px; }

.rail__header {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.rail--left .rail__header { padding-right: 32px; }
.rail--right .rail__header { padding-left: 32px; }
.rail__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-3);
  font-weight: 600;
}

.rail__body {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
}

.rail__vertical-label {
  writing-mode: vertical-rl;
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
  margin-top: 8px;
}
.rail--right .rail__vertical-label { transform: rotate(180deg); }
</style>
