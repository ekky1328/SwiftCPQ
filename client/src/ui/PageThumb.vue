<template>
  <button class="thumb-btn" @click="emit('click')">
    <div :class="['thumb-page', active ? 'thumb-page--active' : '']">
      <!-- Scaled live iframe when src is provided -->
      <div v-if="src" class="thumb-viewport">
        <iframe
          ref="thumbIframe"
          :src="src"
          scrolling="no"
          tabindex="-1"
          class="thumb-iframe"
          @load="onThumbLoad"
        />
      </div>
      <!-- Placeholder when no src -->
      <template v-else>
        <div v-for="i in 7" :key="i" class="thumb-line" :style="{ width: i === 1 ? '55%' : i === 3 ? '80%' : '100%' }" />
      </template>
    </div>
    <div class="thumb-label">
      <span class="mono" style="color: var(--text-3)">{{ String(pageNumber).padStart(2, '0') }}</span>
      <span :style="{ color: active ? 'var(--text-1)' : 'var(--text-3)' }">{{ label }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  pageNumber: number;
  label?: string;
  active?: boolean;
  src?: string;
}>();

const emit = defineEmits<{ click: [] }>();
const thumbIframe = ref<HTMLIFrameElement | null>(null);

function onThumbLoad() {
  // Scroll instantly to this page's position inside the iframe
  thumbIframe.value?.contentWindow?.postMessage(
    { type: 'scroll', page: props.pageNumber, behavior: 'instant' },
    '*'
  );
}
</script>

<style scoped>
.thumb-btn {
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.thumb-page {
  aspect-ratio: 1 / 1.414;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  position: relative;
}

.thumb-page--active {
  border: 2px solid var(--accent);
  padding: 5px; /* compensate for extra border px */
}

/* Clipping viewport for the scaled iframe */
.thumb-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* The iframe is scaled down to fit the thumb. A4 sheet is ~793px wide at 96dpi.
   The thumb inner area is ~104px wide (116px rail - 12px padding - 2px border × 2).
   Scale = 104 / 793 ≈ 0.131. Use a fixed 6000px height to accommodate any proposal. */
.thumb-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 793px;
  height: 6000px;
  border: none;
  pointer-events: none;
  transform: scale(0.131);
  transform-origin: top left;
}

.thumb-line {
  height: 3px;
  background: #e5e7eb;
  border-radius: 1px;
}

.thumb-label {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}
</style>
