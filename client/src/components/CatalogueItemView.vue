<template>
  <div class="swift-app" style="height: 100%; display: flex; flex-direction: column">

    <TopBar :crumbs="['Catalogue', item.sku]">
      <Tag dot :kind="item.isActive ? 'success' : 'warn'">{{ item.isActive ? 'active' : 'inactive' }}</Tag>
      <div class="swift-divider" style="width: 1px; height: 16px; background: var(--border); margin: 0 4px" />
      <Btn icon="duplicate">Duplicate</Btn>
      <Btn variant="danger" icon="trash" @click="archive">Archive</Btn>
      <div class="swift-btn-group">
        <Btn variant="primary" kbd="⌘S" :disabled="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</Btn>
      </div>
    </TopBar>

    <!-- Sub-header -->
    <div style="padding: 10px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 16px; background: var(--surface-0); flex-shrink: 0">
      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1">
        <div style="display: flex; align-items: center; gap: 8px">
          <span class="mono" style="color: var(--text-3); font-size: 11px">{{ item.sku }}</span>
          <Tag>product</Tag>
          <span style="color: var(--text-4); font-size: 11px">·</span>
          <span class="mono" style="color: var(--text-3); font-size: 11px">created {{ fmtDate(item.createdOnDate) }}</span>
        </div>
        <div style="font-size: 16px; font-weight: 500; color: var(--text-1); letter-spacing: -0.01em">{{ item.title }}</div>
      </div>
      <div style="display: flex; gap: 24px; align-items: center; font-size: 12px">
        <Stat label="Cost" :value="fmt(item.cost)" />
        <Stat label="Price" :value="fmt(item.price)" :bold="true" />
        <Stat label="Margin" :value="margin + '%'" :tone="marginTone" />
        <Stat label="Used in" value="—" />
      </div>
    </div>

    <!-- Tabs -->
    <div class="swift-tabs" style="flex-shrink: 0">
      <button v-for="t in tabs" :key="t.id" :class="['swift-tab', activeTab === t.id ? 'active' : '']" @click="activeTab = t.id">
        {{ t.label }}
        <span v-if="t.count != null" class="count">{{ t.count }}</span>
      </button>
    </div>

    <!-- Body -->
    <div style="flex: 1; overflow: auto; padding: 16px; display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-content: start">

      <!-- Main column -->
      <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0">

        <!-- Identity -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Identity</span>
            <div style="flex: 1" />
            <span class="mono" style="font-size: 11px; color: var(--text-3)">required *</span>
          </div>
          <div style="padding: 16px; display: grid; grid-template-columns: 200px 1fr 200px; gap: 12px">
            <div>
              <label class="swift-label">SKU *</label>
              <input v-model="form.sku" class="swift-input mono" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Title *</label>
              <input v-model="form.title" class="swift-input" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Type</label>
              <SegmentedControl
                v-model="form.type"
                :options="[{ value: 'PRODUCT' }, { value: 'BUNDLE' }, { value: 'SERVICE' }]"
              />
            </div>
            <div style="grid-column: 1 / -1">
              <label class="swift-label">Description</label>
              <textarea v-model="form.description" class="swift-input" rows="3" style="width: 100%; resize: vertical; font-family: var(--font-ui); line-height: 1.5" />
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Pricing</span>
            <Tag dot>USD</Tag>
          </div>
          <div style="padding: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px">
            <div>
              <label class="swift-label">Cost</label>
              <input v-model.number="form.cost" type="number" step="0.01" class="swift-input mono" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">List price</label>
              <input v-model.number="form.price" type="number" step="0.01" class="swift-input mono" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Margin %</label>
              <input :value="margin" readonly class="swift-input mono" style="width: 100%; color: var(--text-3)" />
            </div>
            <div>
              <label class="swift-label">Currency</label>
              <select class="swift-select" style="width: 100%">
                <option>USD</option><option>EUR</option><option>AUD</option><option>GBP</option>
              </select>
            </div>
          </div>

          <!-- Volume tiers — preview -->
          <div style="border-top: 1px solid var(--border)">
            <div style="padding: 8px 16px; display: flex; align-items: center; gap: 8px">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); font-weight: 600">Volume tiers</span>
              <Tag kind="warn">preview</Tag>
              <div style="flex: 1" />
            </div>
            <div style="padding: 0 16px 12px; color: var(--text-3); font-size: 12px">
              <!-- TODO(phase-3.5): wire volume tiers to backend -->
              Volume tier persistence requires backend support.
            </div>
          </div>
        </div>

        <!-- Suppliers — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Suppliers</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): wire suppliers to backend -->
            Supplier records require backend support.
          </div>
        </div>

        <!-- Activity — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Recent activity</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): wire audit log to backend -->
            Audit log requires backend support.
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0">

        <!-- Margin guard -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Margin guard</span>
            <Tag dot :kind="marginTone">{{ marginLabel }}</Tag>
          </div>
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 10px">
            <MarginGuard label="Current" :value="parseFloat(margin)" :target="25" :ceiling="45" />
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px">
              <div v-for="s in [{ label: 'Floor', value: '—', tone: '' }, { label: 'Target', value: '25.0%', tone: '' }, { label: 'Ceiling', value: '45.0%', tone: 'success' }]" :key="s.label" style="padding: 4px 6px; background: var(--surface-100); border: 1px solid var(--border-subtle); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 1px">
                <span style="font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500">{{ s.label }}</span>
                <span class="mono" :style="{ fontSize: '11px', fontWeight: 500, color: s.tone === 'success' ? 'var(--success)' : 'var(--text-1)' }">{{ s.value }}</span>
              </div>
            </div>
            <div style="padding: 8px; background: var(--accent-bg); border: 1px solid color-mix(in oklch, var(--accent) 30%, transparent); border-radius: var(--r-md); font-size: 11px; color: var(--text-2); line-height: 1.5">
              <Tag kind="warn" style="display: inline; margin-right: 4px">preview</Tag>
              Floor/target/ceiling persistence requires backend support.
            </div>
          </div>
        </div>

        <!-- Stock & sourcing — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Stock & sourcing</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): wire stock/sourcing to backend -->
            Inventory data requires backend support.
          </div>
        </div>

        <!-- Where used — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Where used</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): query proposals/bundles containing this item -->
            Where-used requires a backend query.
          </div>
        </div>
      </div>
    </div>

    <StatusBar>
      <span><span class="swift-status-dot" :style="{ background: saving ? 'var(--warn)' : 'var(--success)' }" />&nbsp;{{ saving ? 'saving' : 'saved' }}</span>
      <template #right>
        <span>⌘S save · ⌘D duplicate</span>
      </template>
    </StatusBar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import Stat from '../ui/Stat.vue';
import MarginGuard from '../ui/MarginGuard.vue';
import SegmentedControl from '../ui/SegmentedControl.vue';
import { UpdateCatalogueItem } from '../api/api';

const props = defineProps<{ item: CatalogueItem }>();
const emit = defineEmits<{ saved: [item: CatalogueItem] }>();

const toast = useToast();
const router = useRouter();
const saving = ref(false);
const activeTab = ref('overview');

const tabs = [
  { id: 'overview', label: 'Overview', count: null },
  { id: 'pricing', label: 'Pricing', count: null },
  { id: 'suppliers', label: 'Suppliers', count: null },
  { id: 'proposals', label: 'Proposals', count: null },
  { id: 'audit', label: 'Audit log', count: null },
];

const form = ref({
  sku: props.item.sku,
  title: props.item.title,
  description: props.item.description,
  type: props.item.type,
  cost: props.item.cost,
  price: props.item.price,
});

const margin = computed(() => {
  if (!form.value.price) return '0.0';
  return (((form.value.price - form.value.cost) / form.value.price) * 100).toFixed(1);
});

const marginTone = computed(() => {
  const m = parseFloat(margin.value);
  if (m > 30) return 'success';
  if (m > 20) return 'info';
  return 'warn';
});

const marginLabel = computed(() => {
  const m = parseFloat(margin.value);
  if (m > 30) return 'healthy';
  if (m > 20) return 'ok';
  return 'low';
});

function fmt(v: number) {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function save() {
  saving.value = true;
  try {
    const updated = await UpdateCatalogueItem(props.item.id, form.value);
    if (!updated) throw new Error();
    emit('saved', updated);
    toast.add({ severity: 'success', summary: 'Saved', life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Save failed', life: 3000 });
  } finally {
    saving.value = false;
  }
}

function archive() {
  router.push('/catalogue');
}
</script>

