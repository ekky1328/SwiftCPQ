<template>
  <div id="settings-page">
    <Toolbar class="settings-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">System Settings</h1>
      </template>
      <template #end>
        <Button label="Save Settings" icon="pi pi-save" severity="contrast" :loading="saving" @click="saveSettings" />
      </template>
    </Toolbar>

    <div v-if="loading" class="flex justify-center items-center py-24">
      <ProgressSpinner />
    </div>

    <div v-else class="m-2 flex flex-col gap-4 max-w-3xl">

      <!-- Proposal Identifiers -->
      <Card>
        <template #title>Proposal Identifiers</template>
        <template #content>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Prefix</label>
              <InputText v-model="form.proposalPrefix" placeholder="e.g. PROP-" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Suffix</label>
              <InputText v-model="form.proposalSuffix" placeholder="e.g. -2025" fluid />
            </div>
          </div>
        </template>
      </Card>

      <!-- Branding -->
      <Card>
        <template #title>Branding</template>
        <template #content>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Logo URL</label>
            <InputText v-model="form.logoUrl" placeholder="https://..." fluid />
          </div>
        </template>
      </Card>

      <!-- Regional -->
      <Card>
        <template #title>Regional</template>
        <template #content>
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Currency</label>
              <InputText v-model="form.currency" placeholder="e.g. AUD" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Timezone</label>
              <InputText v-model="form.timezone" placeholder="e.g. Australia/Sydney" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Date Format</label>
              <InputText v-model="form.dateFormat" placeholder="e.g. DD/MM/YYYY" fluid />
            </div>
          </div>
        </template>
      </Card>

      <!-- Proposal Defaults -->
      <Card>
        <template #title>Proposal Defaults</template>
        <template #content>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Default Expiry (days)</label>
              <InputNumber v-model="form.defaultExpiryDays" :min="1" :max="365" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Tax Rate (%)</label>
              <InputNumber v-model="form.taxRate" :min="0" :max="100" :min-fraction-digits="2" :max-fraction-digits="2" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Tax Enabled</label>
              <div class="flex items-center gap-2 mt-1">
                <ToggleSwitch v-model="form.taxEnabled" />
                <span class="text-sm text-gray-600">{{ form.taxEnabled ? 'Enabled' : 'Disabled' }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Supplier Settings -->
      <Card>
        <template #title>Supplier Settings</template>
        <template #content>
          <div class="flex flex-col gap-1 max-w-xs">
            <label class="text-sm font-medium">Stale Inventory Days</label>
            <InputNumber v-model="form.staleInventoryDays" :min="1" :max="365" fluid />
            <p class="text-xs text-gray-500 mt-1">Inventory not synced within this many days will be marked stale.</p>
          </div>
        </template>
      </Card>

      <!-- Theme -->
      <Card>
        <template #title>Theme Colours</template>
        <template #content>
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Primary</label>
              <InputText v-model="form.primaryColour" placeholder="#1a73e8" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Secondary</label>
              <InputText v-model="form.secondaryColour" placeholder="#5f6368" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Accent</label>
              <InputText v-model="form.accentColour" placeholder="#fbbc04" fluid />
            </div>
          </div>
        </template>
      </Card>

      <Message v-if="saveError" severity="error" :closable="false">{{ saveError }}</Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

import { GetSystemSettings, UpdateSystemSettings } from '../api/api';

const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const saveError = ref('');

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
  primaryColour: '',
  secondaryColour: '',
  accentColour: '',
});

async function loadSettings() {
  loading.value = true;
  try {
    const data = await GetSystemSettings();
    if (data) {
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
        primaryColour: data.primaryColour ?? '',
        secondaryColour: data.secondaryColour ?? '',
        accentColour: data.accentColour ?? '',
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
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Settings updated successfully', life: 3000 });
  } catch {
    saveError.value = 'Failed to save settings. Please try again.';
  } finally {
    saving.value = false;
  }
}

onMounted(() => loadSettings());
</script>

<style scoped>
#settings-page {
  min-height: 100vh;
}

.settings-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
