<template>
  <div v-if="proposalStore.data !== null" class="proposal-editor">

    <Toast position="top-center" />
    <ConfirmDialog />

    <!-- Topbar -->
    <TopBar :crumbs="['Proposals', identifier]">
      <Tag :kind="proposalStore.isDraft ? 'warn' : 'success'" dot>
        {{ proposalStore.isDraft ? 'draft' : 'saved' }}
      </Tag>
      <span class="topbar-divider" />
      <Btn icon="history" @click="loadVersionHistory">History</Btn>
      <Btn icon="eye" @click="openPreview">Preview</Btn>
      <Btn icon="download" @click="downloadPdf">PDF</Btn>
      <Btn variant="primary" kbd="⌘S" @click="triggerSaveProposal">Save</Btn>
    </TopBar>

    <!-- Sub-header -->
    <div class="sub-header">
      <div class="sub-header__left">
        <div class="sub-header__meta">
          <span class="mono small muted">{{ identifier }} · v{{ proposalStore.data.version }}</span>
          <Tag dot :kind="proposalStore.isDraft ? 'warn' : 'success'">
            {{ proposalStore.isDraft ? 'draft' : proposalStore.data.status?.toLowerCase() || 'saved' }}
          </Tag>
          <span class="muted small">·</span>
          <span class="mono small muted">
            <template v-if="proposalStore.data.createdOnDate">created {{ shortDate(proposalStore.data.createdOnDate) }}</template>
            <template v-if="proposalStore.data.modifiedOnDate"> · modified {{ shortDate(proposalStore.data.modifiedOnDate) }}</template>
          </span>
        </div>
        <div class="sub-header__title">
          <input
            v-model="proposalStore.data.title"
            class="sub-header__title-input"
            placeholder="Untitled proposal"
          />
        </div>
      </div>
      <div class="sub-header__stats">
        <Stat label="Sections" :value="sectionCount" />
        <Stat label="Items" :value="itemCount" />
        <Stat label="Margin" :value="`${marginPct}%`" :tone="marginTone" />
        <Stat
          label="Total"
          :value="formatCurrency(grandTotal)"
          bold
          :class="{ 'totals-pulse': proposalStore.totalsRecalculated }"
        />
        <Stat label="Expires" :value="expiresFormatted" />
      </div>
    </div>

    <!-- Three-pane body -->
    <div class="editor-body">
      <CollapsibleRail side="left" label="Outline">
        <div class="rail-section">
          <div class="rail-section-label">Sections</div>
          <div class="rail-section-content">
            <OutlineNavItem
              v-for="(section, i) in proposalStore.data.sections"
              :key="section.id"
              :index="i + 1"
              :title="section.title || 'Untitled'"
              :type="section.type"
              :item-count="section.items?.length"
              :locked="section.isLocked"
              :recurring="!!section.recurrance && section.recurrance !== 'ONE_TIME'"
              :active="activeSection === section.id"
              @click="scrollToSection(section.id)"
              @lock-toggle="section.isLocked = !section.isLocked"
            />
          </div>
        </div>

        <div class="rail-section rail-section--bordered">
          <div class="rail-section-label">Customer</div>
          <div class="rail-customer">
            <input
              v-model="proposalStore.data.customer.name"
              class="swift-input"
              placeholder="Customer name"
            />
            <label class="swift-label" style="margin-top: 8px;">Expires</label>
            <input
              v-model="expiresOnInput"
              type="date"
              class="swift-input"
            />
          </div>
        </div>
      </CollapsibleRail>

      <main class="editor-pane">
        <ProposalSection
          v-for="section in proposalStore.data.sections"
          :id="`section_${section.id}`"
          :key="section.id"
          :data="section"
        />
      </main>

      <CollapsibleRail side="right" label="Summary">
        <div class="rail-summary">
          <section class="swift-panel" :class="{ 'totals-pulse': proposalStore.totalsRecalculated }">
            <header class="swift-panel__header">
              <span style="font-weight: 500;">Totals</span>
              <Tag dot>USD</Tag>
            </header>
            <div class="swift-panel__body" style="padding: 0;">
              <div
                v-for="(values, recurrence) in proposalStore.data._totals"
                :key="recurrence"
                class="total-row"
              >
                <div class="total-row__label">{{ humanRecurrance(String(recurrence)) }}</div>
                <div class="total-row__line">
                  <span class="mono small muted">cost</span>
                  <span class="mono small">{{ formatCurrency(values.cost) }}</span>
                </div>
                <div class="total-row__line">
                  <span class="mono small muted">margin</span>
                  <span class="mono small success">{{ formatCurrency(values.margin) }}</span>
                </div>
                <div class="total-row__line total-row__line--strong">
                  <span class="mono">total</span>
                  <span class="mono">{{ formatCurrency(values.total) }}</span>
                </div>
              </div>
              <div v-if="!hasTotals" class="swift-empty" style="padding: 16px;">No totals yet.</div>
            </div>
          </section>

          <section class="swift-panel">
            <header class="swift-panel__header">
              <span style="font-weight: 500;">Activity</span>
            </header>
            <div class="swift-panel__body" style="padding: 0;">
              <ActivityRow
                v-for="(a, i) in activity"
                :key="i"
                :actor="a.actor"
                :verb="a.verb"
                :target="a.target"
                :timestamp="a.timestamp"
              />
              <div v-if="activity.length === 0" class="swift-empty" style="padding: 12px;">No recent activity.</div>
            </div>
          </section>
        </div>
      </CollapsibleRail>
    </div>

    <!-- Status bar -->
    <StatusBar
      :status="proposalStore.isDraft ? 'unsaved' : 'synced'"
      :tone="proposalStore.isDraft ? 'warn' : 'success'"
    >
      <span>{{ sectionCount }} sections · {{ itemCount }} items · margin {{ marginPct }}% · {{ formatCurrency(grandTotal) }}</span>
      <template #right>
        <Kbd>⌘S</Kbd>&nbsp;save · <Kbd>⌘[</Kbd>&nbsp;outline · <Kbd>⌘\</Kbd>&nbsp;summary
      </template>
    </StatusBar>

    <!-- Version History Dialog -->
    <Dialog
      v-model:visible="showVersionHistory"
      :header="previewVersion ? `v${previewVersion.version} — ${shortDate(previewVersion.createdOnDate)}` : 'Version History'"
      :style="{ width: '620px' }"
      modal
      @hide="previewVersion = null"
    >
      <template v-if="!previewVersion">
        <p v-if="versions.length === 0" class="muted small">No saved versions yet. Versions are created each time you save.</p>
        <table v-else class="swift-table">
          <thead>
            <tr><th style="width: 80px;">Version</th><th>Saved at</th><th style="width: 160px;"></th></tr>
          </thead>
          <tbody>
            <tr v-for="v in versions" :key="v.id">
              <td class="col-id">v{{ v.version }}</td>
              <td class="mono small">{{ shortDate(v.createdOnDate) }}</td>
              <td class="row-actions" style="visibility: visible;">
                <Btn variant="ghost" @click="loadPreview(v)">View</Btn>
                <Btn variant="primary" @click="confirmRevert(v)">Restore</Btn>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-else>
        <Btn variant="ghost" icon="chevron" @click="previewVersion = null">Back to list</Btn>
        <div class="version-preview">
          <div>
            <div class="swift-label">Title</div>
            <div>{{ previewVersion.title || '(untitled)' }}</div>
          </div>
          <div v-if="previewVersion.description">
            <div class="swift-label">Description</div>
            <div class="small">{{ previewVersion.description }}</div>
          </div>
          <div>
            <div class="swift-label">Status</div>
            <Tag>{{ previewVersion.status }}</Tag>
          </div>
        </div>

        <div class="version-sections">
          <div v-for="section in previewVersion.sections" :key="section.id" class="version-section">
            <div class="version-section__title">
              {{ section.title }}
              <span class="muted small">{{ section.type }}</span>
            </div>
            <ul v-if="section.items?.length">
              <li v-for="item in section.items" :key="item.id">
                <span>{{ item.title || '(unnamed)' }}</span>
                <span class="mono small">{{ item.qty }}× {{ formatCurrency(item.price) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
          <Btn variant="primary" icon="history" @click="confirmRevert(previewVersion)">Restore this version</Btn>
        </div>
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cloneDeep } from 'lodash';

import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';

import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import Kbd from '../ui/Kbd.vue';
import Stat from '../ui/Stat.vue';
import CollapsibleRail from '../ui/CollapsibleRail.vue';
import OutlineNavItem from '../ui/OutlineNavItem.vue';
import ActivityRow from '../ui/ActivityRow.vue';

import ProposalSection from '../components/ProposalSection.vue';
import { useProposalStore } from '../store/proposalStore';
import { concatProposalIdentifier, formatCurrency } from '../utils/helpers';
import {
  GetProposalById,
  SaveProposal,
  GetProposalVersions,
  GetProposalVersion,
  RevertProposalVersion,
  DownloadProposalPdf,
} from '../api/api';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const proposalStore = useProposalStore();

const activeSection = ref<number | null>(null);
const showVersionHistory = ref(false);
const versions = ref<any[]>([]);
const previewVersion = ref<any>(null);
const previewLoading = ref<number | null>(null);

const identifier = computed(() =>
  proposalStore.data ? concatProposalIdentifier(proposalStore.data) : ''
);

const sections = computed(() => proposalStore.data?.sections ?? []);
const sectionCount = computed(() => sections.value.length);
const itemCount = computed(() =>
  sections.value.reduce((acc, s) => acc + (s.items?.length ?? 0), 0)
);

const grandTotal = computed(() => {
  const totals = proposalStore.data?._totals;
  if (!totals) return 0;
  return Object.values(totals).reduce((acc, v) => acc + v.total, 0);
});

const grandCost = computed(() => {
  const totals = proposalStore.data?._totals;
  if (!totals) return 0;
  return Object.values(totals).reduce((acc, v) => acc + v.cost, 0);
});

const marginPct = computed(() => {
  if (grandTotal.value <= 0) return '0.0';
  const m = ((grandTotal.value - grandCost.value) / grandTotal.value) * 100;
  return m.toFixed(1);
});

const marginTone = computed<'success' | 'warn' | 'error' | undefined>(() => {
  const v = parseFloat(marginPct.value);
  if (v >= 30) return 'success';
  if (v >= 15) return 'warn';
  if (grandTotal.value === 0) return undefined;
  return 'error';
});

const hasTotals = computed(() => {
  const t = proposalStore.data?._totals;
  return t && Object.keys(t).length > 0;
});

const expiresOnInput = computed({
  get() {
    const v = proposalStore.data?.expiresOnDate;
    if (!v) return '';
    return new Date(v).toISOString().slice(0, 10);
  },
  set(v: string) {
    if (proposalStore.data) {
      proposalStore.data.expiresOnDate = v ? new Date(v).toISOString() : undefined;
    }
  },
});

const expiresFormatted = computed(() => {
  const v = proposalStore.data?.expiresOnDate;
  return v ? new Date(v).toISOString().slice(0, 10) : '—';
});

const activity = computed(() => {
  if (!proposalStore.data) return [] as { actor: string; verb: string; target?: string; timestamp: string }[];
  const items: { actor: string; verb: string; target?: string; timestamp: string }[] = [];
  if (proposalStore.data.modifiedOnDate) {
    items.push({
      actor: proposalStore.data.author?.name || 'Someone',
      verb: 'last modified',
      timestamp: proposalStore.data.modifiedOnDate,
    });
  }
  if (proposalStore.data.createdOnDate) {
    items.push({
      actor: proposalStore.data.author?.name || 'Someone',
      verb: 'created',
      target: `v${proposalStore.data.version}`,
      timestamp: proposalStore.data.createdOnDate,
    });
  }
  return items;
});

function shortDate(iso: string | undefined) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

function humanRecurrance(key: string) {
  return key.toLowerCase().replace(/_/g, ' ');
}

function scrollToSection(id: number) {
  activeSection.value = id;
  const el = document.getElementById(`section_${id}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function triggerSaveProposal() {
  if (!proposalStore.data) return;
  const payloadCopy = cloneDeep(proposalStore.data);
  if (payloadCopy._totals && payloadCopy._section_totals) {
    delete payloadCopy._section_totals;
    delete payloadCopy._totals;
  }
  await SaveProposal(payloadCopy as any);
  proposalStore.resetDraftStatus();
  toast.add({ severity: 'success', summary: 'Saved', detail: 'Proposal saved', life: 3000 });
}

async function loadVersionHistory() {
  versions.value = [];
  previewVersion.value = null;
  showVersionHistory.value = true;
  if (!proposalStore.data) return;
  const result = await GetProposalVersions(String(proposalStore.data.id));
  if (result) versions.value = result;
}

async function loadPreview(v: any) {
  previewLoading.value = v.id;
  if (!proposalStore.data) return;
  const result = await GetProposalVersion(String(proposalStore.data.id), v.id);
  previewLoading.value = null;
  if (result) previewVersion.value = result;
}

function confirmRevert(v: any) {
  confirm.require({
    message: `Restore the proposal to v${v.version}? Your current state will be saved as a new version first.`,
    header: 'Restore Version',
    icon: 'pi pi-history',
    acceptLabel: 'Restore',
    rejectLabel: 'Cancel',
    accept: async () => {
      if (!proposalStore.data) return;
      const restored = await RevertProposalVersion(String(proposalStore.data.id), v.id);
      if (restored) {
        proposalStore.data = restored as any;
        proposalStore.recalculateTotals();
        proposalStore.resetDraftStatus();
        previewVersion.value = null;
        showVersionHistory.value = false;
        toast.add({ severity: 'success', summary: 'Restored', detail: `Restored to v${v.version}`, life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to restore version', life: 3000 });
      }
    },
  });
}

function openPreview() {
  if (!proposalStore.data) return;
  router.push(`/proposals/${proposalStore.data.id}/preview`);
}

async function downloadPdf() {
  if (!proposalStore.data) return;
  const blob = await DownloadProposalPdf(proposalStore.data.id);
  if (!blob) {
    toast.add({ severity: 'error', summary: 'PDF Error', detail: 'Failed to generate PDF', life: 4000 });
    return;
  }
  const url = URL.createObjectURL(blob as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${proposalStore.data.identifier || proposalStore.data.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleKeyDown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    triggerSaveProposal();
  }
}

function handleFocus() {
  proposalStore.isTabFocused = !!document.hasFocus();
}

onMounted(async () => {
  if (proposalStore.data === null) {
    const proposal = await GetProposalById(route.params.id as string);
    if ((proposal as any)?.error) {
      router.push('/');
      toast.add({ severity: 'error', summary: 'Error', detail: (proposal as any).message, life: 3000 });
      return;
    }
    if (proposal) {
      proposalStore.data = proposal as any;
      proposalStore.recalculateTotals();
      proposalStore.resetDraftStatus();
      document.title = `${concatProposalIdentifier(proposalStore.data!)} - ${proposalStore.data!.title}`;
    }
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleFocus);
});

onUnmounted(() => {
  proposalStore.data = null;
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('focus', handleFocus);
  window.removeEventListener('blur', handleFocus);
});
</script>

<style scoped>
.proposal-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.topbar-divider {
  width: 1px;
  height: 16px;
  background: var(--border);
  margin: 0 4px;
}

.sub-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--surface-0);
  flex-shrink: 0;
}
.sub-header__left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.sub-header__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sub-header__title-input {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-1);
  letter-spacing: -0.01em;
  background: transparent;
  border: 1px solid transparent;
  padding: 2px 6px;
  margin-left: -6px;
  border-radius: var(--r-sm);
  width: 100%;
  outline: none;
  font-family: var(--font-ui);
}
.sub-header__title-input:hover { border-color: var(--border-subtle); }
.sub-header__title-input:focus { border-color: var(--accent); background: var(--surface-100); }

.sub-header__stats {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 12px;
  flex-shrink: 0;
}

.editor-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  min-height: 0;
}
.editor-pane {
  flex: 1;
  overflow: auto;
  background: var(--surface-0);
  padding: 16px;
  min-width: 0;
}

.rail-section { padding: 12px 12px 0; }
.rail-section--bordered {
  border-top: 1px solid var(--border-subtle);
  margin-top: 12px;
}
.rail-section-label {
  padding: 0 0 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-3);
  font-weight: 600;
}
.rail-section-content { padding: 0 6px; }
.rail-customer { display: flex; flex-direction: column; gap: 4px; }

.rail-summary {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.total-row {
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  align-items: baseline;
}
.total-row:first-child { border-top: none; }
.total-row__label {
  font-size: 12px;
  color: var(--text-2);
  font-weight: 400;
  grid-column: 1 / -1;
  text-transform: capitalize;
}
.total-row__line {
  display: contents;
}
.total-row__line > span:first-child {
  font-size: 11px;
  color: var(--text-3);
}
.total-row__line > span:last-child {
  font-size: 11px;
  text-align: right;
  color: var(--text-2);
}
.total-row__line--strong > span:first-child { color: var(--text-1); font-weight: 500; font-size: 12px; }
.total-row__line--strong > span:last-child { color: var(--text-1); font-weight: 600; font-size: 13px; }

.totals-pulse {
  animation: swift-pulse 600ms ease-out;
}
@keyframes swift-pulse {
  0% { background: var(--accent-bg); }
  100% { background: transparent; }
}

.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.muted { color: var(--text-3); }
.small { font-size: 11px; }
.success { color: var(--success); }

.version-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--surface-100);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  margin: 12px 0;
}
.version-sections {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 256px;
  overflow-y: auto;
}
.version-section {
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 8px;
}
.version-section__title { font-size: 13px; font-weight: 500; }
.version-section ul {
  margin: 4px 0 0 12px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.version-section ul li {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-2);
}
</style>
