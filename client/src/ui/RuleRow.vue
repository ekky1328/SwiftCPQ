<template>
  <div :style="rowStyle">
    <Tag :kind="tone.kind">{{ tone.label }}</Tag>

    <div style="display: flex; align-items: center; gap: 6px; min-width: 0">
      <span style="font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em">WHEN</span>
      <code class="mono" :style="codeStyle">{{ when }}</code>
    </div>

    <span style="color: var(--text-4); text-align: center">→</span>

    <div style="display: flex; align-items: center; gap: 6px; min-width: 0">
      <span style="font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em">THEN</span>
      <code class="mono" :style="codeStyle">{{ then }}</code>
    </div>

    <Btn variant="ghost" icon="kebab" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from './Tag.vue';
import Btn from './Btn.vue';

const props = defineProps<{
  when: string;
  then: string;
  type?: 'auto' | 'default' | 'require' | 'block';
}>();

const tones: Record<string, { label: string; kind: string }> = {
  auto:    { label: 'auto',    kind: 'info' },
  default: { label: 'default', kind: 'info' },
  require: { label: 'require', kind: 'warn' },
  block:   { label: 'block',   kind: 'danger' },
};

const tone = computed(() => tones[props.type ?? 'auto']);

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '70px 1fr 24px 1fr 32px',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 16px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: '12px',
};

const codeStyle = {
  background: 'var(--surface-100)',
  padding: '2px 6px',
  borderRadius: '2px',
  fontSize: '11px',
  color: 'var(--text-1)',
  border: '1px solid var(--border-subtle)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
</script>
