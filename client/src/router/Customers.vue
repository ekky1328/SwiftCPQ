<template>
  <div class="swift-app" style="height: 100%; display: flex; flex-direction: column">

    <TopBar :crumbs="['Customers']">
      <div class="swift-search">
        <span style="position: absolute; left: 8px; color: var(--text-3); font-size: 13px">⌕</span>
        <input
          v-model="searchQuery"
          class="swift-input"
          placeholder="Search name, email, phone..."
          style="padding-left: 28px"
        />
      </div>
      <Btn variant="primary" icon="plus" kbd="N" @click="openCreate">New customer</Btn>
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
        <span>{{ filtered.length }} of {{ customers.length }}</span>
        <span style="color: var(--text-4)">·</span>
        <span>sort: name ↑</span>
      </div>

      <table class="swift-table">
        <thead>
          <tr>
            <th style="width: 32px"><input type="checkbox" @click.stop /></th>
            <th class="sorted">Name <span class="sort-ico">↑</span></th>
            <th>Primary contact</th>
            <th>Email</th>
            <th style="width: 160px">Phone</th>
            <th>Location</th>
            <th style="width: 80px">Status</th>
            <th style="width: 80px">Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in filtered"
            :key="c.id"
            style="cursor: pointer"
            @click="navigateTo(c)"
          >
            <td><input type="checkbox" @click.stop /></td>
            <td>{{ c.name }}</td>
            <td style="color: var(--text-2)">{{ contactName(c) || '—' }}</td>
            <td style="color: var(--text-2)">{{ c.email || '—' }}</td>
            <td class="mono" style="color: var(--text-2); font-size: 11px">{{ c.phone || '—' }}</td>
            <td style="color: var(--text-2); font-size: 11px">{{ formatAddress(c.address) || '—' }}</td>
            <td>
              <Tag dot :kind="c.isActive ? 'success' : 'warn'">{{ c.isActive ? 'active' : 'inactive' }}</Tag>
            </td>
            <td style="color: var(--text-3); font-size: 11px; font-family: var(--font-mono)">{{ relativeDate(c.modifiedOnDate) }}</td>
          </tr>
          <tr v-if="!loading && filtered.length === 0">
            <td colspan="8">
              <div class="swift-empty">No customers match your search.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <StatusBar>
      <span><span class="swift-status-dot" :style="{ background: loading ? 'var(--warn)' : 'var(--success)' }" />&nbsp;{{ loading ? 'loading' : 'synced' }}</span>
      <span>{{ customers.length }} customers</span>
      <template #right>
        <span>↑↓ navigate · ↵ open · ⌘N new · / search</span>
      </template>
    </StatusBar>

    <!-- Create dialog -->
    <Dialog v-model:visible="createDialogVisible" header="New customer" modal style="width: 480px">
      <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px">
        <div>
          <label class="swift-label">Name *</label>
          <input v-model="createForm.name" class="swift-input" placeholder="Acme Corp" style="width: 100%" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <div>
            <label class="swift-label">Email</label>
            <input v-model="createForm.email" class="swift-input" placeholder="contact@acme.com" style="width: 100%" />
          </div>
          <div>
            <label class="swift-label">Phone</label>
            <input v-model="createForm.phone" class="swift-input mono" placeholder="+61 2 0000 0000" style="width: 100%" />
          </div>
        </div>
        <div v-if="createError" style="color: var(--error); font-size: 12px">{{ createError }}</div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <Btn @click="createDialogVisible = false">Cancel</Btn>
          <Btn variant="primary" :disabled="saving" @click="submitCreate">
            {{ saving ? 'Saving...' : 'Create' }}
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

import {
  GetCustomers, CreateCustomer,
} from '../api/api';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  contact: { firstName: string; lastName: string };
  address: { street: string; city: string; state: string; postcode: string; country: string };
  createdOnDate: string;
  modifiedOnDate: string;
}

const router = useRouter();
const toast = useToast();

const customers = ref<CustomerRow[]>([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const activeTab = ref<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

const createDialogVisible = ref(false);
const createError = ref('');
const createForm = ref({ name: '', email: '', phone: '' });

const tabs = [
  { key: 'ALL' as const, label: 'All' },
  { key: 'ACTIVE' as const, label: 'Active' },
  { key: 'ARCHIVED' as const, label: 'Archived' },
];

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return customers.value.filter((c) => {
    if (activeTab.value === 'ACTIVE' && !c.isActive) return false;
    if (activeTab.value === 'ARCHIVED' && c.isActive) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });
});

function tabCount(key: string): number {
  if (key === 'ALL') return customers.value.length;
  if (key === 'ACTIVE') return customers.value.filter((c) => c.isActive).length;
  if (key === 'ARCHIVED') return customers.value.filter((c) => !c.isActive).length;
  return 0;
}

function contactName(c: CustomerRow): string {
  const f = c.contact?.firstName ?? '';
  const l = c.contact?.lastName ?? '';
  return `${f} ${l}`.trim();
}

function formatAddress(a: CustomerRow['address']): string {
  if (!a) return '';
  const parts = [a.street, a.city, a.state, a.postcode, a.country].filter(Boolean);
  return parts.join(', ');
}

function relativeDate(iso: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1d';
  if (d < 7) return `${d}d`;
  if (d < 14) return '1w';
  return `${Math.floor(d / 7)}w`;
}

function navigateTo(c: CustomerRow) {
  router.push(`/customers/${c.id}`);
}

async function loadCustomers() {
  loading.value = true;
  try {
    customers.value = (await GetCustomers()) ?? [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  createForm.value = { name: '', email: '', phone: '' };
  createError.value = '';
  createDialogVisible.value = true;
}

async function submitCreate() {
  createError.value = '';
  if (!createForm.value.name.trim()) {
    createError.value = 'Name is required.';
    return;
  }
  saving.value = true;
  try {
    const created = await CreateCustomer(createForm.value);
    if (!created) throw new Error();
    customers.value.unshift(created);
    createDialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Created', detail: 'Customer added', life: 3000 });
  } catch {
    createError.value = 'Failed to create customer.';
  } finally {
    saving.value = false;
  }
}

onMounted(loadCustomers);
</script>
