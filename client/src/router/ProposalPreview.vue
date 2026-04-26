<!-- Phase 4: iframe approach (option A).
     Templater renders at /pdf/:template/:id — we embed it here and communicate
     via postMessage. This keeps PDF and screen output in sync by construction. -->
<template>
  <div class="swift-app" style="height: 100%; display: flex; flex-direction: column">

    <TopBar :crumbs="['Proposals', proposal?.identifier ?? id, 'Preview']">
      <Tag v-if="proposal" dot :kind="proposal.status === 'draft' ? 'warn' : 'success'">
        {{ proposal.status }}
      </Tag>
      <span class="mono" style="font-size: 11px; color: var(--text-3); margin-left: 4px">
        {{ pageCount > 0 ? `${pageCount} pages` : '' }}
      </span>
      <div style="width: 1px; height: 16px; background: var(--border); margin: 0 4px" />
      <Btn icon="history" @click="$router.push(`/proposals/${id}`)">Back to editor</Btn>
      <Btn icon="download" :disabled="downloading" @click="downloadPdf">
        {{ downloading ? 'Downloading...' : 'Download PDF' }}
      </Btn>
      <Btn variant="primary" icon="bolt" kbd="⌘↵" @click="send">Send to client</Btn>
    </TopBar>

    <!-- Preview toolbar -->
    <div style="height: 36px; border-bottom: 1px solid var(--border); background: var(--surface-50); padding: 0 12px; display: flex; align-items: center; gap: 12px; font-size: 12px; flex-shrink: 0">
      <div class="swift-btn-group">
        <Btn @click="goPage(-1)">&#8249;</Btn>
        <button class="swift-btn" style="min-width: 72px; justify-content: center; cursor: default">
          <span class="mono">{{ activePage }} / {{ pageCount || '?' }}</span>
        </button>
        <Btn @click="goPage(1)">&#8250;</Btn>
      </div>

      <div style="width: 1px; height: 16px; background: var(--border)" />

      <div class="swift-btn-group">
        <Btn @click="zoom = Math.max(50, zoom - 10)">-</Btn>
        <button class="swift-btn" style="min-width: 52px"><span class="mono">{{ zoom }}%</span></button>
        <Btn @click="zoom = Math.min(150, zoom + 10)">+</Btn>
        <Btn @click="zoom = 85">Fit</Btn>
      </div>
    </div>

    <!-- Three-pane body -->
    <div style="flex: 1; min-height: 0; display: grid; grid-template-columns: 140px 1fr 280px; grid-template-rows: 1fr; overflow: hidden">

      <!-- Left: page thumbnails -->
      <div style="border-right: 1px solid var(--border); background: var(--surface-50); overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px">
        <PageThumb
          v-for="p in thumbPages"
          :key="p.n"
          :page-number="p.n"
          :label="p.label"
          :active="activePage === p.n"
          :src="iframeUrl ?? undefined"
          @click="scrollToPage(p.n)"
        />
        <div v-if="thumbPages.length === 0" class="swift-empty" style="font-size: 11px">Loading...</div>
      </div>

      <!-- Center: A4 canvas with iframe -->
      <div style="min-height: 0; background: var(--surface-0); overflow: auto; display: flex; align-items: flex-start; justify-content: center; padding: 32px; background-image: radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--text-3) 14%, transparent) 1px, transparent 0); background-size: 16px 16px">
        <div :style="{
          width: ((zoom / 100) * 794) + 'px',
          height: ((zoom / 100) * iframeContentHeight) + 'px',
          background: 'white',
          boxShadow: '0 1px 0 rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.35)',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
        }">
          <!-- iframe is full natural size; outer div scales it via shrinking -->
          <iframe
            v-if="iframeUrl && !iframeError"
            ref="iframeRef"
            :src="iframeUrl"
            scrolling="no"
            :style="{
              width: '794px',
              height: iframeContentHeight + 'px',
              border: 'none',
              display: 'block',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }"
            @load="onIframeLoad"
          />
          <div v-else-if="iframeError" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #999; font-size: 13px; padding: 24px; text-align: center">
            <span style="font-size: 20px">⚠</span>
            <span>Templater not reachable at <code style="font-size: 11px">{{ iframeUrl }}</code></span>
            <span style="font-size: 11px; color: #666">Start the templater service, then <button style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 11px; padding: 0; text-decoration: underline" @click="iframeError = false">retry</button>.</span>
          </div>
          <div v-else style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 13px">
            Loading preview...
          </div>
        </div>
      </div>

      <!-- Right: pre-flight checks + variables -->
      <div style="border-left: 1px solid var(--border); background: var(--surface-50); overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 12px">

        <!-- Pre-flight -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Pre-flight</span>
            <Tag v-if="errorCount > 0" dot kind="error">{{ errorCount }} error{{ errorCount !== 1 ? 's' : '' }}</Tag>
            <Tag v-else-if="warnCount > 0" dot kind="warn">{{ warnCount }} issue{{ warnCount !== 1 ? 's' : '' }}</Tag>
            <Tag v-else dot kind="success">All clear</Tag>
          </div>
          <div style="padding: 0; font-size: 12px">
            <PreflightItem
              v-for="(check, i) in preflightChecks"
              :key="i"
              :kind="check.kind"
              :label="check.label"
              :cta="check.cta"
            />
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; flex-direction: column; gap: 6px">
          <Btn style="width: 100%" :disabled="downloading" @click="downloadPdf">
            {{ downloading ? 'Downloading...' : 'Download PDF' }}
          </Btn>
          <Btn variant="primary" style="width: 100%" @click="send">Send to client</Btn>
        </div>
      </div>
    </div>

    <StatusBar>
      <span><span class="swift-status-dot" style="background: var(--success)" />&nbsp;preview</span>
      <span>{{ pageCount > 0 ? `${pageCount} pages` : 'loading' }}</span>
      <template #right>
        <span>⌘↵ send · ⌘P download</span>
      </template>
    </StatusBar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import PageThumb from '../ui/PageThumb.vue';
import PreflightItem from '../ui/PreflightItem.vue';
import { useTheme } from '../composables/useTheme';
import { usePreflight } from '../composables/usePreflight';
import { GetProposalById, DownloadProposalPdf } from '../api/api';
import type { Proposal } from '../types/Proposal';

const TEMPLATER_BASE = import.meta.env.MODE === 'development' ? 'http://localhost:5005' : '';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { mode, accent } = useTheme();

const id = route.params.id as string;
const proposal = ref<Proposal | null>(null);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeError = ref(false);
const pageCount = ref(0);
const iframeContentHeight = ref(1200);
const activePage = ref(1);
const zoom = ref(85);
const downloading = ref(false);

const iframeUrl = computed(() => {
  if (!proposal.value) return null;
  const tpl = (proposal.value as any).selectedTemplate ?? 'default';
  return `${TEMPLATER_BASE}/pdf/${tpl}/${proposal.value.id}`;
});

const preflightChecks = computed(() =>
  proposal.value ? usePreflight(proposal.value) : []
);

const errorCount = computed(() => preflightChecks.value.filter((c) => c.kind === 'error').length);
const warnCount = computed(() => preflightChecks.value.filter((c) => c.kind === 'warn').length);

// Build static thumb list, updated when pageCount changes via postMessage
const PAGE_LABELS = ['Cover', 'Summary', 'Scope', 'Pricing', 'Terms', 'Sign-off'];
const thumbPages = computed(() => {
  const n = pageCount.value || 6;
  return Array.from({ length: n }, (_, i) => ({
    n: i + 1,
    label: PAGE_LABELS[i] ?? `Page ${i + 1}`,
  }));
});

function postToIframe(msg: object) {
  // Use '*' — messages contain only theme/scroll data, not credentials
  iframeRef.value?.contentWindow?.postMessage(msg, '*');
}

function onIframeLoad() {
  // Detect connection failure: Chrome loads chrome-error:// into the frame
  try {
    const href = iframeRef.value?.contentWindow?.location?.href ?? '';
    if (href.startsWith('chrome-error:') || href.startsWith('about:')) {
      iframeError.value = true;
      return;
    }
  } catch {
    // Cross-origin access throws once the real page loads — that's fine
  }
  iframeError.value = false;
  postToIframe({ type: 'set-theme', mode: mode.value, accent: accent.value });
}

function onMessage(e: MessageEvent) {
  if (typeof e.data !== 'object') return;
  if (e.data.type === 'page-count') pageCount.value = e.data.value;
  if (e.data.type === 'scroll-height') iframeContentHeight.value = e.data.value;
  if (e.data.type === 'visible-page') activePage.value = e.data.value;
}

function scrollToPage(n: number) {
  activePage.value = n;
  postToIframe({ type: 'scroll', page: n });
}

function goPage(delta: number) {
  const next = Math.max(1, Math.min(pageCount.value || 1, activePage.value + delta));
  scrollToPage(next);
}

// Sync theme changes to iframe
watch([mode, accent], ([m, a]) => {
  postToIframe({ type: 'set-theme', mode: m, accent: a });
});

async function downloadPdf() {
  if (!proposal.value) return;
  downloading.value = true;
  try {
    const blob = await DownloadProposalPdf(proposal.value.id);
    if (!blob) throw new Error('No blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proposal.value.identifier || proposal.value.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.add({ severity: 'error', summary: 'PDF failed', life: 3000 });
  } finally {
    downloading.value = false;
  }
}

function send() {
  // Route back to editor where Send action lives; don't call API directly
  router.push(`/proposals/${id}`);
}

onMounted(async () => {
  proposal.value = await GetProposalById(id);
  window.addEventListener('message', onMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage);
});
</script>
