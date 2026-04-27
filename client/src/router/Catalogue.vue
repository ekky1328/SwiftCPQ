<template>
  <div class="swift-app" style="height: 100%; display: flex; flex-direction: column">

    <TopBar :crumbs="['Catalogue']">
      <div class="swift-search">
        <span style="position: absolute; left: 8px; color: var(--text-3); font-size: 13px">⌕</span>
        <input
          v-model="searchQuery"
          class="swift-input"
          placeholder="Search SKU, title, supplier..."
          style="padding-left: 28px"
          @input="onSearch"
        />
      </div>
      <Btn icon="filter">Type: all</Btn>
      <Btn icon="filter">Supplier: all</Btn>
      <Btn variant="primary" icon="plus" kbd="N" @click="openCreate">New item</Btn>
    </TopBar>

    <div class="swift-tabs" style="flex-shrink: 0">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['swift-tab', activeTab === tab.key ? 'active' : '']"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="count">{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <div style="flex: 1; overflow: hidden; display: grid; grid-template-columns: 1fr 340px; min-height: 0">

      <!-- List -->
      <div style="overflow: auto">
        <div style="padding: 4px 16px; font-size: 11px; color: var(--text-3); display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border-subtle); font-family: var(--font-mono)">
          <span>{{ filteredItems.length }} of {{ items.length }}</span>
          <span style="color: var(--text-4)">·</span>
          <span>sort: sku ↑</span>
        </div>

        <table class="swift-table">
          <thead>
            <tr>
              <th style="width: 32px"><input type="checkbox" @change="toggleAll" /></th>
              <th style="width: 130px" class="sorted">SKU <span class="sort-ico">↑</span></th>
              <th>Title</th>
              <th style="width: 80px">Type</th>
              <th style="width: 100px">Supplier</th>
              <th class="col-currency" style="width: 100px">Cost</th>
              <th class="col-currency" style="width: 100px">Price</th>
              <th class="col-currency" style="width: 80px">Margin</th>
              <th style="width: 60px">Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              :class="{ selected: selectedId === item.id }"
              style="cursor: pointer"
              @click="selectedId = item.id"
              @dblclick="navigateTo(item)"
            >
              <td><input type="checkbox" @click.stop /></td>
              <td class="col-id">{{ item.sku }}</td>
              <td>{{ item.title }}</td>
              <td>
                <Tag :kind="item.type === 'BUNDLE' ? 'accent' : 'info'">{{ item.type.toLowerCase() }}</Tag>
              </td>
              <td style="color: var(--text-2)">-</td>
              <td class="col-currency" style="color: var(--text-2)">{{ fmt(item.cost) }}</td>
              <td class="col-currency">{{ fmt(item.price) }}</td>
              <td class="col-currency" :style="{ color: marginColor(item) }">{{ calcMargin(item.cost, item.price) }}%</td>
              <td style="color: var(--text-3); font-size: 11px; font-family: var(--font-mono)">{{ relativeDate(item.modifiedOnDate) }}</td>
            </tr>
            <tr v-if="!loading && filteredItems.length === 0">
              <td colspan="9">
                <div class="swift-empty">No items match your search.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Inspector -->
      <aside v-if="selected" style="border-left: 1px solid var(--border); background: var(--surface-50); overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 12px">
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span class="mono" style="color: var(--text-3); font-size: 11px">{{ selected.sku }}</span>
            <Tag :kind="selected.type === 'BUNDLE' ? 'accent' : 'info'">{{ selected.type.toLowerCase() }}</Tag>
            <div style="flex: 1" />
            <Btn variant="ghost" icon="pencil" @click="openEdit(selected)" />
            <Btn variant="ghost" icon="trash" @click="confirmDelete(selected)" />
          </div>
          <div class="swift-panel__body" style="padding: 12px; display: flex; flex-direction: column; gap: 12px">
            <div style="font-size: 14px; font-weight: 500; line-height: 1.35">{{ selected.title }}</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px; background: var(--surface-100); border: 1px solid var(--border); border-radius: var(--r-md)">
              <div v-for="field in [
                { label: 'Cost', value: fmt(selected.cost), mono: true },
                { label: 'Price', value: fmt(selected.price), mono: true },
                { label: 'Margin', value: calcMargin(selected.cost, selected.price) + '%', mono: true },
                { label: 'Type', value: selected.type, mono: false },
              ]" :key="field.label">
                <div style="font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; margin-bottom: 2px">{{ field.label }}</div>
                <div :class="field.mono ? 'mono' : ''" style="font-size: 12px; color: var(--text-1)">{{ field.value }}</div>
              </div>
            </div>

            <div>
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); font-weight: 600; margin-bottom: 6px">Used in proposals</div>
              <div class="swift-empty" style="font-size: 11px">
                <Tag kind="warn">preview</Tag>
                <span style="margin-left: 6px; color: var(--text-3)">Where-used requires backend support</span>
              </div>
            </div>
          </div>
        </div>

        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Price history</span>
            <span class="mono" style="color: var(--text-3); font-size: 11px">last 90d</span>
            <Tag kind="warn" style="margin-left: auto">preview</Tag>
          </div>
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px">
            <Sparkline :values="demoSparkline" />
            <div style="font-size: 11px; color: var(--text-3); font-family: var(--font-mono); display: flex; justify-content: space-between">
              <span>cost history</span>
              <span style="color: var(--text-4)">no data yet</span>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 6px">
          <Btn style="flex: 1" @click="navigateTo(selected)">Open detail</Btn>
        </div>
      </aside>

      <aside v-else style="border-left: 1px solid var(--border); background: var(--surface-50); display: flex; align-items: center; justify-content: center">
        <div class="swift-empty">Select a row to inspect</div>
      </aside>
    </div>

    <StatusBar>
      <span><span class="swift-status-dot" :style="{ background: loading ? 'var(--warn)' : 'var(--success)' }" />&nbsp;{{ loading ? 'loading' : 'synced' }}</span>
      <span>{{ stats }}</span>
      <template #right>
        <span>↑↓ navigate · ↵ open · ⌘N new · / search</span>
      </template>
    </StatusBar>

    <!-- Create / Edit Dialog (legacy flow — preserved for v1) -->
    <Dialog v-model:visible="dialogVisible" :header="editingItem ? 'Edit Item' : 'New Catalogue Item'" modal style="width: 520px">
      <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <div>
            <label class="swift-label">Title *</label>
            <input v-model="form.title" class="swift-input" placeholder="e.g. Managed Firewall" style="width: 100%" />
          </div>
          <div>
            <label class="swift-label">SKU</label>
            <input v-model="form.sku" class="swift-input mono" placeholder="e.g. FW-001" style="width: 100%" />
          </div>
        </div>

        <div>
          <label class="swift-label">Description</label>
          <textarea v-model="form.description" class="swift-input" rows="3" placeholder="Optional description..." style="width: 100%; resize: vertical" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px">
          <div>
            <label class="swift-label">Type</label>
            <SegmentedControl
              v-model="form.type"
              :options="[{ value: 'PRODUCT' }, { value: 'BUNDLE' }]"
            />
          </div>
          <div>
            <label class="swift-label">Cost</label>
            <input v-model.number="form.cost" type="number" class="swift-input mono" step="0.01" style="width: 100%" />
          </div>
          <div>
            <label class="swift-label">Price</label>
            <input v-model.number="form.price" type="number" class="swift-input mono" step="0.01" style="width: 100%" />
          </div>
        </div>

        <div v-if="form.cost != null && form.price" style="font-size: 12px; color: var(--text-3)">
          Margin: <strong style="color: var(--text-1)">{{ calcMargin(form.cost, form.price) }}%</strong>
        </div>

        <div v-if="formError" style="color: var(--error); font-size: 12px">{{ formError }}</div>
      </div>

      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <Btn @click="dialogVisible = false">Cancel</Btn>
          <Btn variant="primary" :disabled="saving" @click="submitForm">
            {{ saving ? 'Saving...' : editingItem ? 'Save changes' : 'Create' }}
          </Btn>
        </div>
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';

import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import Sparkline from '../ui/Sparkline.vue';
import SegmentedControl from '../ui/SegmentedControl.vue';

import {
  GetCatalogueItems,
  CreateCatalogueItem,
  UpdateCatalogueItem,
  DeleteCatalogueItem,
} from '../api/api';
import { formatCurrency } from '../utils/helpers';

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();

const items = ref<CatalogueItem[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const activeTab = ref<'PRODUCT' | 'BUNDLE' | 'SERVICE' | 'ARCHIVED'>('PRODUCT');
const selectedId = ref<string | null>(null);
const dialogVisible = ref(false);
const saving = ref(false);
const editingItem = ref<CatalogueItem | null>(null);
const formError = ref('');

const demoSparkline = [100, 102, 101, 105, 108, 107, 110, 112];

const tabs = [
  { key: 'PRODUCT' as const, label: 'Products' },
  { key: 'BUNDLE' as const, label: 'Bundles' },
  { key: 'SERVICE' as const, label: 'Services' },
  { key: 'ARCHIVED' as const, label: 'Archived' },
];

const emptyForm = () => ({
  title: '',
  sku: '',
  description: '',
  type: 'PRODUCT' as 'PRODUCT' | 'BUNDLE',
  cost: 0,
  price: 0,
});

const form = ref(emptyForm());

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return items.value.filter((it) => {
    if (activeTab.value !== 'ARCHIVED' && it.type !== activeTab.value) return false;
    if (activeTab.value === 'SERVICE') return false;
    if (!q) return true;
    return it.sku.toLowerCase().includes(q) || it.title.toLowerCase().includes(q);
  });
});

const selected = computed(() => items.value.find((i) => i.id === selectedId.value) ?? null);

const stats = computed(() => {
  const products = items.value.filter((i) => i.type === 'PRODUCT').length;
  const bundles = items.value.filter((i) => i.type === 'BUNDLE').length;
  return `${products} products · ${bundles} bundles`;
});

function tabCount(key: string): number {
  if (key === 'PRODUCT') return items.value.filter((i) => i.type === 'PRODUCT').length;
  if (key === 'BUNDLE') return items.value.filter((i) => i.type === 'BUNDLE').length;
  return 0;
}

function fmt(v: number): string {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function calcMargin(cost: number, price: number): string {
  if (!price) return '0.00';
  return (((price - cost) / price) * 100).toFixed(1);
}

function marginColor(item: CatalogueItem): string {
  const m = ((item.price - item.cost) / item.price) * 100;
  if (m > 30) return 'var(--success)';
  if (m > 20) return 'var(--text-1)';
  return 'var(--warn)';
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1d';
  if (d < 7) return `${d}d`;
  if (d < 14) return '1w';
  return `${Math.floor(d / 7)}w`;
}

function navigateTo(item: CatalogueItem) {
  router.push(`/catalogue/${item.id}`);
}

function toggleAll() {
  // bulk-select placeholder
}

async function loadItems(search?: string) {
  loading.value = true;
  try {
    const data = await GetCatalogueItems(search);
    items.value = data ?? [];
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadItems(searchQuery.value), 300);
}

function openCreate() {
  editingItem.value = null;
  form.value = emptyForm();
  formError.value = '';
  dialogVisible.value = true;
}

function openEdit(item: CatalogueItem) {
  editingItem.value = item;
  form.value = {
    title: item.title,
    sku: item.sku,
    description: item.description,
    type: item.type,
    cost: item.cost,
    price: item.price,
  };
  formError.value = '';
  dialogVisible.value = true;
}

async function submitForm() {
  formError.value = '';
  if (!form.value.title.trim()) {
    formError.value = 'Title is required.';
    return;
  }
  saving.value = true;
  try {
    if (editingItem.value) {
      const updated = await UpdateCatalogueItem(editingItem.value.id, form.value);
      if (!updated) throw new Error('Update failed');
      const idx = items.value.findIndex((i) => i.id === editingItem.value!.id);
      if (idx !== -1) items.value[idx] = updated;
      toast.add({ severity: 'success', summary: 'Saved', detail: 'Item updated', life: 3000 });
    } else {
      const created = await CreateCatalogueItem(form.value);
      if (!created) throw new Error('Create failed');
      items.value.unshift(created);
      toast.add({ severity: 'success', summary: 'Created', detail: 'Item added to catalogue', life: 3000 });
    }
    dialogVisible.value = false;
  } catch {
    formError.value = 'Something went wrong. Please try again.';
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item: CatalogueItem) {
  confirm.require({
    message: `Delete "${item.title}" from the catalogue?`,
    header: 'Confirm Delete',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      const ok = await DeleteCatalogueItem(item.id);
      if (ok) {
        items.value = items.value.filter((i) => i.id !== item.id);
        if (selectedId.value === item.id) selectedId.value = null;
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Item removed', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
      }
    },
  });
}

onMounted(() => loadItems());
</script>
