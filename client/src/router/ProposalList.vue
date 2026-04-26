<template>
  <TopBar :crumbs="['Workspace', 'Proposals']">
    <div class="swift-search">
      <span class="ico"><Icon name="search" /></span>
      <input
        v-model="search"
        class="swift-input"
        placeholder="Search proposals, customers, SKUs…"
      />
      <span class="kbd">⌘K</span>
    </div>
    <Btn icon="filter">Filter</Btn>
    <Btn icon="columns">Columns</Btn>
    <Btn variant="primary" icon="plus" kbd="N" @click="triggerCreateNewProposal">New proposal</Btn>
  </TopBar>

  <div class="swift-tabs">
    <div
      v-for="t in tabs"
      :key="t.id"
      class="swift-tab"
      :class="{ active: activeTab === t.id }"
      @click="activeTab = t.id"
    >
      {{ t.label }} <span class="count">{{ t.count }}</span>
    </div>
  </div>

  <div class="swift-content">
    <div class="proposal-list__meta">
      <span>{{ filtered.length }} of {{ proposals.length }}</span>
      <span class="meta-sep">·</span>
      <span>sort: modified ↓</span>
      <span class="meta-sep">·</span>
      <span>group: none</span>
      <div style="flex: 1" />
      <span v-if="selected.size">{{ selected.size }} selected</span>
    </div>

    <table class="swift-table">
      <thead>
        <tr>
          <th style="width: 32px">
            <input
              type="checkbox"
              :checked="allSelected"
              :indeterminate.prop="someSelected"
              @change="toggleAll"
            />
          </th>
          <th style="width: 130px">ID</th>
          <th style="width: 50px">Ver</th>
          <th>Title</th>
          <th style="width: 200px">Customer</th>
          <th style="width: 90px">Status</th>
          <th style="width: 120px">Created</th>
          <th class="sorted" style="width: 130px">
            Modified <span class="sort-ico">↓</span>
          </th>
          <th style="width: 60px"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in filtered"
          :key="row.id"
          :class="{ selected: selected.has(row.id) }"
          @click="openProposal(row)"
          style="cursor: pointer"
        >
          <td @click.stop>
            <input
              type="checkbox"
              :checked="selected.has(row.id)"
              @change="toggle(row.id)"
            />
          </td>
          <td class="col-id">{{ row.identifier }}</td>
          <td class="col-id">v{{ row.version }}</td>
          <td style="color: var(--text-1)">{{ row.title }}</td>
          <td style="color: var(--text-2)">{{ row.customer?.name ?? '—' }}</td>
          <td>
            <Tag :kind="statusKind(row.status)" dot>{{ row.status || 'draft' }}</Tag>
          </td>
          <td class="col-id" style="color: var(--text-3)">{{ shortDate(row.createdOnDate) }}</td>
          <td style="color: var(--text-3); font-size: 12px">{{ shortDate(row.modifiedOnDate) }}</td>
          <td @click.stop>
            <div class="row-actions">
              <Btn variant="ghost" icon="pencil" />
              <Btn variant="ghost" icon="duplicate" />
              <Btn variant="ghost" icon="kebab" />
            </div>
          </td>
        </tr>
        <tr v-if="!loading && filtered.length === 0">
          <td colspan="9" class="swift-empty">
            No proposals match this view.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <StatusBar :status="loading ? 'loading' : 'synced'" :tone="loading ? 'info' : 'success'">
    <span>—</span>
    <span>{{ proposals.length }} proposals · {{ draftCount }} drafts</span>
    <!-- TODO(phase-3): backend lacks aggregate value rollup; surface here once added. -->
  </StatusBar>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { CreateNewProposal, GetProposals } from '../api/api';
import { useProposalStore } from '../store/proposalStore';
import type { Proposal } from '../types/Proposal';

import Btn from '../ui/Btn.vue';
import Icon from '../ui/Icon.vue';
import Tag from '../ui/Tag.vue';
import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';

const router = useRouter();
const proposalStore = useProposalStore();

const proposals = ref<Proposal[]>([]);
const loading = ref(true);
const search = ref('');
const activeTab = ref<'all' | 'mine' | 'drafts' | 'awaiting' | 'expiring'>('all');
const selected = ref(new Set<number>());

onMounted(async () => {
  document.title = 'SwiftCPQ — Quote faster with precision';
  const data = await GetProposals();
  proposals.value = Array.isArray(data) ? data : [];
  loading.value = false;
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  let rows = proposals.value;
  if (activeTab.value === 'drafts') {
    rows = rows.filter(r => (r.status || 'draft').toLowerCase() === 'draft');
  }
  // TODO(phase-2): wire 'mine' once owner field surfaces; 'awaiting' / 'expiring' need status taxonomy.
  if (q) {
    rows = rows.filter(r =>
      [r.identifier, r.title, r.customer?.name].some(v => v?.toLowerCase().includes(q))
    );
  }
  return rows;
});

const draftCount = computed(() =>
  proposals.value.filter(r => (r.status || 'draft').toLowerCase() === 'draft').length
);

const tabs = computed(() => [
  { id: 'all',      label: 'All',             count: proposals.value.length },
  { id: 'mine',     label: 'Mine',            count: 0 },
  { id: 'drafts',   label: 'Drafts',          count: draftCount.value },
  { id: 'awaiting', label: 'Awaiting reply',  count: 0 },
  { id: 'expiring', label: 'Expiring < 7d',   count: 0 },
] as const);

const allSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every(r => selected.value.has(r.id))
);
const someSelected = computed(() =>
  !allSelected.value && filtered.value.some(r => selected.value.has(r.id))
);

function toggle(id: number) {
  const next = new Set(selected.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selected.value = next;
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set();
  } else {
    selected.value = new Set(filtered.value.map(r => r.id));
  }
}

function statusKind(status?: string) {
  switch ((status || 'draft').toLowerCase()) {
    case 'sent': return 'info';
    case 'accepted': return 'success';
    case 'rejected': return 'error';
    case 'expired': return undefined;
    case 'draft':
    default: return 'warn';
  }
}

function shortDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function openProposal(row: Proposal) {
  router.push(`/proposals/${row.id}`);
}

async function triggerCreateNewProposal() {
  loading.value = true;
  const data = await CreateNewProposal();
  if (data) {
    proposalStore.data = data;
    router.push(`/proposals/${data.id}`);
  } else {
    loading.value = false;
  }
}
</script>

<style scoped>
.proposal-list__meta {
  padding: 6px 16px;
  font-size: 11px;
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
}
.proposal-list__meta .meta-sep {
  color: var(--text-4);
}
.swift-empty {
  text-align: center;
}
</style>
