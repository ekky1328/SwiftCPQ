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

    <div style="flex: 1; overflow: auto; min-height: 0">
      <div style="padding: 4px 16px; font-size: 11px; color: var(--text-3); display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border-subtle); font-family: var(--font-mono)">
        <span>{{ filteredItems.length }} of {{ items.length }}</span>
        <span style="color: var(--text-4)">·</span>
        <span>sort: sku ↑</span>
      </div>

      <table class="swift-table">
        <thead>
          <tr>
            <th style="width: 32px"><input type="checkbox" @change="toggleAll" /></th>
            <th style="width: 140px" class="sorted">SKU <span class="sort-ico">↑</span></th>
            <th>Title</th>
            <th style="width: 90px">Type</th>
            <th style="width: 140px">Supplier</th>
            <th class="col-currency" style="width: 110px">Cost</th>
            <th class="col-currency" style="width: 110px">Price</th>
            <th class="col-currency" style="width: 90px">Margin</th>
            <th class="col-num" style="width: 70px">Stock</th>
            <th style="width: 80px">Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredItems"
            :key="item.id"
            style="cursor: pointer"
            @click="navigateTo(item)"
          >
            <td><input type="checkbox" @click.stop /></td>
            <td class="col-id">{{ item.sku }}</td>
            <td>{{ item.title }}</td>
            <td>
              <Tag :kind="item.type === 'BUNDLE' ? 'accent' : 'info'">{{ item.type.toLowerCase() }}</Tag>
            </td>
            <td style="color: var(--text-2)">—</td>
            <td class="col-currency" style="color: var(--text-2)">{{ fmt(item.cost) }}</td>
            <td class="col-currency">{{ fmt(item.price) }}</td>
            <td class="col-currency" :style="{ color: marginColor(item) }">{{ calcMargin(item.cost, item.price) }}%</td>
            <td class="col-num" style="color: var(--text-4)">—</td>
            <td style="color: var(--text-3); font-size: 11px; font-family: var(--font-mono)">{{ relativeDate(item.modifiedOnDate) }}</td>
          </tr>
          <tr v-if="!loading && filteredItems.length === 0">
            <td colspan="10">
              <div class="swift-empty">No items match your search.</div>
            </td>
          </tr>
        </tbody>
      </table>
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';

import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import SegmentedControl from '../ui/SegmentedControl.vue';

import {
  GetCatalogueItems,
  CreateCatalogueItem,
  UpdateCatalogueItem,
} from '../api/api';

const router = useRouter();
const toast = useToast();

const items = ref<CatalogueItem[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const activeTab = ref<'PRODUCT' | 'BUNDLE' | 'SERVICE' | 'ARCHIVED'>('PRODUCT');
const dialogVisible = ref(false);
const saving = ref(false);
const editingItem = ref<CatalogueItem | null>(null);
const formError = ref('');

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

onMounted(() => loadItems());
</script>
