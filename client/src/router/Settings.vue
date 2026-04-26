<template>
  <div class="swift-main" style="height: 100%; display: flex; flex-direction: column;">
    <TopBar :crumbs="['Settings']">
      <Btn icon="save" variant="primary" :disabled="saving" @click="saveSettings">
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </Btn>
    </TopBar>

    <div style="flex: 1; overflow: auto; padding: 20px;">
      <div v-if="loading" style="display: flex; justify-content: center; padding: 48px">
        <ProgressSpinner />
      </div>

      <div v-else style="display: flex; flex-direction: column; gap: 12px; max-width: 720px">

        <!-- Proposal Identifiers -->
        <div class="swift-panel">
          <div class="swift-panel__header"><span style="font-weight: 500">Proposal Identifiers</span></div>
          <div class="swift-panel__body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <div>
              <label class="swift-label">Prefix</label>
              <input class="swift-input" v-model="form.proposalPrefix" placeholder="e.g. PROP-" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Suffix</label>
              <input class="swift-input" v-model="form.proposalSuffix" placeholder="e.g. -2025" style="width: 100%" />
            </div>
          </div>
        </div>

        <!-- Branding -->
        <div class="swift-panel">
          <div class="swift-panel__header"><span style="font-weight: 500">Branding</span></div>
          <div class="swift-panel__body">
            <label class="swift-label">Logo URL</label>
            <input class="swift-input" v-model="form.logoUrl" placeholder="https://..." style="width: 100%" />
          </div>
        </div>

        <!-- Regional -->
        <div class="swift-panel">
          <div class="swift-panel__header"><span style="font-weight: 500">Regional</span></div>
          <div class="swift-panel__body" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px">
            <div>
              <label class="swift-label">Currency</label>
              <input class="swift-input" v-model="form.currency" placeholder="AUD" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Timezone</label>
              <input class="swift-input" v-model="form.timezone" placeholder="Australia/Sydney" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Date Format</label>
              <input class="swift-input" v-model="form.dateFormat" placeholder="DD/MM/YYYY" style="width: 100%" />
            </div>
          </div>
        </div>

        <!-- Proposal Defaults -->
        <div class="swift-panel">
          <div class="swift-panel__header"><span style="font-weight: 500">Proposal Defaults</span></div>
          <div class="swift-panel__body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <div>
              <label class="swift-label">Default Expiry (days)</label>
              <InputNumber v-model="form.defaultExpiryDays" :min="1" :max="365" fluid />
            </div>
            <div>
              <label class="swift-label">Tax Rate (%)</label>
              <InputNumber v-model="form.taxRate" :min="0" :max="100" :min-fraction-digits="2" :max-fraction-digits="2" fluid />
            </div>
            <div style="display: flex; align-items: center; gap: 8px; padding-top: 18px">
              <ToggleSwitch v-model="form.taxEnabled" />
              <span style="font-size: 12px; color: var(--text-2)">Tax {{ form.taxEnabled ? 'enabled' : 'disabled' }}</span>
            </div>
          </div>
        </div>

        <!-- Supplier Settings -->
        <div class="swift-panel">
          <div class="swift-panel__header"><span style="font-weight: 500">Supplier Settings</span></div>
          <div class="swift-panel__body" style="max-width: 240px">
            <label class="swift-label">Stale Inventory Days</label>
            <InputNumber v-model="form.staleInventoryDays" :min="1" :max="365" fluid />
            <p style="font-size: 11px; color: var(--text-3); margin-top: 4px">Inventory not synced within this many days will be marked stale.</p>
          </div>
        </div>

        <!-- Theme -->
        <div class="swift-panel">
          <div class="swift-panel__header"><span style="font-weight: 500">Theme</span></div>
          <div class="swift-panel__body" style="display: flex; flex-direction: column; gap: 16px">
            <div>
              <label class="swift-label">Mode</label>
              <SegmentedControl
                :model-value="localMode"
                :options="[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]"
                @update:model-value="onModeChange"
              />
              <p style="font-size: 11px; color: var(--text-3); margin-top: 4px">Personal preference — stored in your browser only.</p>
            </div>
            <div>
              <label class="swift-label">Tenant accent</label>
              <AccentPicker v-model="form.accent" />
              <p style="font-size: 11px; color: var(--text-3); margin-top: 4px">Default colour for everyone in this workspace. Save to apply.</p>
            </div>
          </div>
        </div>

        <Tag v-if="saveError" kind="error">{{ saveError }}</Tag>
      </div>
    </div>

    <StatusBar>
      <span><span class="swift-status-dot" style="background: var(--success)" />&nbsp;settings</span>
    </StatusBar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import ProgressSpinner from 'primevue/progressspinner';
import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import AccentPicker from '../ui/AccentPicker.vue';
import SegmentedControl from '../ui/SegmentedControl.vue';
import { useTheme } from '../composables/useTheme';
import type { ThemeAccent, ThemeMode } from '../composables/useTheme';
import { GetSystemSettings, UpdateSystemSettings } from '../api/api';

const toast = useToast();
const { mode, setMode, setTenantDefault } = useTheme();

const localMode = ref<ThemeMode>(mode.value);
const loading = ref(true);
const saving = ref(false);
const saveError = ref('');

const VALID_ACCENTS = new Set<ThemeAccent>(['amber', 'indigo', 'violet', 'green', 'red']);

const form = ref({
  proposalPrefix: '',
  proposalSuffix: '',
  logoUrl: '',
  currency: 'AUD',
  timezone: 'UTC',
  dateFormat: 'DD/MM/YYYY',
  defaultExpiryDays: 30,
  taxEnabled: false,
  taxRate: 10,
  staleInventoryDays: 28,
  accent: 'amber' as ThemeAccent,
});

function onModeChange(m: string) {
  localMode.value = m as ThemeMode;
  setMode(m as ThemeMode);
}

async function loadSettings() {
  loading.value = true;
  try {
    const data = await GetSystemSettings();
    if (data) {
      const rawAccent = data.accent ?? data.accentColour ?? 'amber';
      form.value = {
        proposalPrefix: data.proposalPrefix ?? '',
        proposalSuffix: data.proposalSuffix ?? '',
        logoUrl: data.logoUrl ?? '',
        currency: data.currency ?? 'AUD',
        timezone: data.timezone ?? 'UTC',
        dateFormat: data.dateFormat ?? 'DD/MM/YYYY',
        defaultExpiryDays: data.defaultExpiryDays ?? 30,
        taxEnabled: data.taxEnabled ?? false,
        taxRate: data.taxRate ?? 10,
        staleInventoryDays: data.staleInventoryDays ?? 28,
        accent: (VALID_ACCENTS.has(rawAccent) ? rawAccent : 'amber') as ThemeAccent,
      };
    }
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saveError.value = '';
  saving.value = true;
  try {
    const result = await UpdateSystemSettings(form.value);
    if (!result) throw new Error('Save failed');
    setTenantDefault(form.value.accent);
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Settings updated', life: 3000 });
  } catch {
    saveError.value = 'Failed to save settings. Please try again.';
  } finally {
    saving.value = false;
  }
}

onMounted(() => loadSettings());
</script>
