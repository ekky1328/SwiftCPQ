<template>
  <div class="swift-app" style="height: 100%; display: flex; flex-direction: column">

    <TopBar :crumbs="['Catalogue', item.sku]">
      <Tag dot :kind="item.isActive ? 'success' : 'warn'">{{ item.isActive ? 'active' : 'inactive' }}</Tag>
      <div style="width: 1px; height: 16px; background: var(--border); margin: 0 4px" />
      <Btn icon="duplicate">Duplicate</Btn>
      <Btn variant="danger" icon="trash" @click="$router.push('/catalogue')">Archive</Btn>
      <div class="swift-btn-group">
        <Btn variant="primary" kbd="⌘S" :disabled="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</Btn>
      </div>
    </TopBar>

    <!-- Sub-header -->
    <div style="padding: 10px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 16px; background: var(--surface-0); flex-shrink: 0">
      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1">
        <div style="display: flex; align-items: center; gap: 8px">
          <span class="mono" style="color: var(--text-3); font-size: 11px">{{ item.sku }}</span>
          <Tag kind="accent">bundle</Tag>
          <span style="color: var(--text-4); font-size: 11px">·</span>
          <span class="mono" style="color: var(--text-3); font-size: 11px">created {{ fmtDate(item.createdOnDate) }}</span>
        </div>
        <div style="font-size: 16px; font-weight: 500; color: var(--text-1); letter-spacing: -0.01em">{{ item.title }}</div>
      </div>
      <div style="display: flex; gap: 24px; align-items: center; font-size: 12px">
        <Stat label="Bundle price" :value="fmt(item.price)" :bold="true" />
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
          </div>
          <div style="padding: 16px; display: grid; grid-template-columns: 200px 1fr; gap: 12px">
            <div>
              <label class="swift-label">SKU *</label>
              <input v-model="form.sku" class="swift-input mono" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Title *</label>
              <input v-model="form.title" class="swift-input" style="width: 100%" />
            </div>
            <div style="grid-column: 1 / -1">
              <label class="swift-label">Description</label>
              <textarea v-model="form.description" class="swift-input" rows="3" style="width: 100%; resize: vertical; font-family: var(--font-ui); line-height: 1.5" />
            </div>
          </div>
        </div>

        <!-- Required components — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Required components</span>
            <Tag kind="warn">preview</Tag>
            <span class="mono" style="font-size: 11px; color: var(--text-3); margin-left: 8px">always included · drives bundle price</span>
            <div style="flex: 1" />
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): wire required components to backend -->
            Required component persistence requires backend support.
          </div>
        </div>

        <!-- Optional add-ons — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Optional add-ons</span>
            <Tag kind="warn">preview</Tag>
            <span class="mono" style="font-size: 11px; color: var(--text-3); margin-left: 8px">customer chooses at quote time</span>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): wire optional add-ons to backend -->
            Optional add-on persistence requires backend support.
          </div>
        </div>

        <!-- Configuration rules — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Configuration rules</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 4px">
            <!-- TODO(phase-3.5): wire config rules to backend -->
            <div v-for="rule in demoRules" :key="rule.when">
              <RuleRow :when="rule.when" :then="rule.then" :type="rule.type" />
            </div>
            <div style="padding: 8px; color: var(--text-3); font-size: 11px">
              Demo rules shown above. Persistence requires backend support.
            </div>
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

        <!-- Bundle pricing -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Bundle pricing</span>
          </div>
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; font-size: 12px">
            <div style="display: flex; justify-content: space-between">
              <span style="color: var(--text-3)">Cost</span>
              <span class="mono" style="color: var(--text-1)">{{ fmt(item.cost) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between">
              <span style="color: var(--text-3)">Price</span>
              <span class="mono" style="color: var(--text-1); font-weight: 600">{{ fmt(item.price) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between">
              <span style="color: var(--text-3)">Margin</span>
              <span class="mono" :style="{ color: marginTone === 'success' ? 'var(--success)' : 'var(--text-1)' }">{{ margin }}%</span>
            </div>
          </div>
        </div>

        <!-- Bundle settings -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Bundle settings</span>
          </div>
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; font-size: 12px">
            <div style="display: flex; justify-content: space-between">
              <span style="color: var(--text-3)">Type</span>
              <span class="mono" style="color: var(--text-1)">Bundle</span>
            </div>
            <div style="display: flex; justify-content: space-between">
              <span style="color: var(--text-3)">Currency</span>
              <span class="mono" style="color: var(--text-1)">USD</span>
            </div>
          </div>
        </div>

        <!-- Targeting — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Targeting</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): wire targeting to backend -->
            Targeting requires backend support.
          </div>
        </div>

        <!-- Where used — preview -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Where used</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            <!-- TODO(phase-3.5): query proposals containing this bundle -->
            Where-used requires a backend query.
          </div>
        </div>
      </div>
    </div>

    <StatusBar>
      <span><span class="swift-status-dot" :style="{ background: saving ? 'var(--warn)' : 'var(--success)' }" />&nbsp;{{ saving ? 'saving' : 'saved' }}</span>
      <template #right>
        <span>⌘S save · ⌥A add component</span>
      </template>
    </StatusBar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import Stat from '../ui/Stat.vue';
import RuleRow from '../ui/RuleRow.vue';
import { UpdateCatalogueItem } from '../api/api';

const props = defineProps<{ item: CatalogueItem }>();
const emit = defineEmits<{ saved: [item: CatalogueItem] }>();

const toast = useToast();
const saving = ref(false);
const activeTab = ref('overview');

const tabs = [
  { id: 'overview', label: 'Overview', count: null },
  { id: 'components', label: 'Components', count: null },
  { id: 'rules', label: 'Configuration rules', count: null },
  { id: 'pricing', label: 'Pricing', count: null },
  { id: 'proposals', label: 'Proposals', count: null },
  { id: 'audit', label: 'Audit log', count: null },
];

const demoRules = [
  { when: 'qty(component) > 4', then: 'auto-add extra × (qty - 4)', type: 'auto' as const },
  { when: 'customer.tier = "enterprise"', then: 'set advanced_license.default = on', type: 'default' as const },
  { when: 'seat_count > 50', then: 'block this bundle', type: 'block' as const },
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

const marginTone = computed((): 'success' | 'warn' | 'info' => {
  const m = parseFloat(margin.value);
  if (m > 30) return 'success';
  if (m > 20) return 'info';
  return 'warn';
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
</script>
