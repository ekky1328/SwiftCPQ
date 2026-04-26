<template>
  <div
    class="iec"
    :class="[
      `iec--${type}`,
      `iec--align-${effectiveAlign}`,
      { 'iec--editing': editing, 'iec--disabled': disabled },
    ]"
    @click="startEdit"
  >
    <input
      v-if="editing"
      ref="inputEl"
      v-model="draft"
      class="swift-input iec__input"
      :class="{ 'swift-input--mono': isNumeric }"
      :inputmode="isNumeric ? 'decimal' : 'text'"
      :disabled="disabled"
      @keydown="onKeyDown"
      @blur="onBlur"
    />
    <span v-else class="iec__display">{{ formattedDisplay }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

type CellType = 'qty' | 'price' | 'cost' | 'percent' | 'text';
type NavDirection = 'next-cell' | 'prev-cell' | 'next-row' | 'prev-row';

const props = withDefaults(defineProps<{
  modelValue: string | number | null | undefined;
  type?: CellType;
  disabled?: boolean;
  align?: 'left' | 'right';
  format?: (value: string | number) => string;
}>(), {
  type: 'text',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'commit', value: string | number): void;
  (e: 'revert'): void;
  (e: 'nav', direction: NavDirection): void;
}>();

const isNumeric = computed(() =>
  props.type === 'qty' || props.type === 'price' || props.type === 'cost' || props.type === 'percent'
);

const effectiveAlign = computed(() => props.align ?? (isNumeric.value ? 'right' : 'left'));

const editing = ref(false);
const draft = ref<string>('');
const inputEl = ref<HTMLInputElement | null>(null);
let startValue: string | number | null | undefined = null;
let suppressBlurCommit = false;

const formattedDisplay = computed(() => {
  const v = props.modelValue;
  if (v === null || v === undefined || v === '') return isNumeric.value ? '—' : '';
  if (props.format) return props.format(v);
  if (props.type === 'price' || props.type === 'cost') {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  }
  if (props.type === 'percent') {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return `${n.toFixed(1)}%`;
  }
  return String(v);
});

function startEdit() {
  if (props.disabled || editing.value) return;
  startValue = props.modelValue;
  draft.value = props.modelValue == null ? '' : String(props.modelValue);
  editing.value = true;
  nextTick(() => {
    inputEl.value?.focus();
    inputEl.value?.select();
  });
}

function commit(): boolean {
  if (!editing.value) return false;
  const raw = draft.value.trim();
  if (isNumeric.value) {
    if (raw === '') {
      // empty numeric reverts
      revert();
      return false;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) {
      revert();
      return false;
    }
    editing.value = false;
    if (n !== Number(startValue)) {
      emit('update:modelValue', n);
      emit('commit', n);
    }
    return true;
  }
  editing.value = false;
  if (raw !== String(startValue ?? '')) {
    emit('update:modelValue', raw);
    emit('commit', raw);
  }
  return true;
}

function revert() {
  editing.value = false;
  draft.value = '';
  emit('revert');
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    suppressBlurCommit = true;
    revert();
    inputEl.value?.blur();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    suppressBlurCommit = true;
    if (commit()) emit('nav', e.shiftKey ? 'prev-row' : 'next-row');
    return;
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    suppressBlurCommit = true;
    if (commit()) emit('nav', e.shiftKey ? 'prev-cell' : 'next-cell');
    return;
  }
}

function onBlur() {
  if (suppressBlurCommit) {
    suppressBlurCommit = false;
    return;
  }
  commit();
}

defineExpose({ focus: startEdit });
</script>

<style scoped>
.iec {
  position: relative;
  cursor: text;
  min-height: 20px;
  display: flex;
  align-items: center;
}
.iec--disabled { cursor: not-allowed; opacity: 0.6; }
.iec--align-right { justify-content: flex-end; }
.iec--align-left { justify-content: flex-start; }

.iec__display {
  display: inline-block;
  width: 100%;
  padding: 0;
  font-family: var(--font-ui);
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.iec--align-right .iec__display {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-sm);
  text-align: right;
}

.iec__input {
  height: 22px;
  padding: 0 4px;
}
.iec--align-right .iec__input {
  text-align: right;
}
</style>
