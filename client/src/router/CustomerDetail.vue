<template>
  <div v-if="loading" class="swift-app" style="height: 100%; display: flex; align-items: center; justify-content: center">
    <div class="swift-empty">Loading...</div>
  </div>
  <div v-else-if="!customer" class="swift-app" style="height: 100%; display: flex; align-items: center; justify-content: center">
    <div class="swift-empty">Customer not found.</div>
  </div>

  <div v-else class="swift-app" style="height: 100%; display: flex; flex-direction: column">

    <TopBar :crumbs="['Customers', customer.name]">
      <Tag dot :kind="customer.isActive ? 'success' : 'warn'">{{ customer.isActive ? 'active' : 'inactive' }}</Tag>
      <div style="width: 1px; height: 16px; background: var(--border); margin: 0 4px" />
      <Btn variant="danger" icon="trash" @click="confirmDelete">Delete</Btn>
      <div class="swift-btn-group">
        <Btn variant="primary" kbd="⌘S" :disabled="saving" @click="saveIdentity">{{ saving ? 'Saving...' : 'Save' }}</Btn>
      </div>
    </TopBar>

    <!-- Sub-header -->
    <div style="padding: 10px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 16px; background: var(--surface-0); flex-shrink: 0">
      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1">
        <div style="display: flex; align-items: center; gap: 8px">
          <Tag>customer</Tag>
          <span style="color: var(--text-4); font-size: 11px">·</span>
          <span class="mono" style="color: var(--text-3); font-size: 11px">created {{ fmtDate(customer.createdOnDate) }}</span>
        </div>
        <div style="font-size: 16px; font-weight: 500; color: var(--text-1); letter-spacing: -0.01em">{{ customer.name }}</div>
      </div>
      <div style="display: flex; gap: 24px; align-items: center; font-size: 12px">
        <Stat label="Contacts" :value="contacts.length" />
        <Stat label="Locations" :value="locations.length" />
        <Stat label="Proposals" value="—" />
        <Stat label="Last activity" :value="fmtDate(customer.modifiedOnDate)" />
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

        <!-- Overview / Identity -->
        <div v-if="activeTab === 'overview'" class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Identity</span>
            <div style="flex: 1" />
            <span class="mono" style="font-size: 11px; color: var(--text-3)">required *</span>
          </div>
          <div style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <div style="grid-column: 1 / -1">
              <label class="swift-label">Name *</label>
              <input v-model="form.name" class="swift-input" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Email</label>
              <input v-model="form.email" class="swift-input" style="width: 100%" />
            </div>
            <div>
              <label class="swift-label">Phone</label>
              <input v-model="form.phone" class="swift-input mono" style="width: 100%" />
            </div>
          </div>
        </div>

        <!-- Contacts table -->
        <div v-if="activeTab === 'overview' || activeTab === 'contacts'" class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Contacts</span>
            <span class="count" style="margin-left: 6px">{{ contacts.length }}</span>
            <div style="flex: 1" />
            <Btn icon="plus" @click="addContact">Add contact</Btn>
          </div>
          <table class="swift-table">
            <thead>
              <tr>
                <th>First name</th>
                <th>Last name</th>
                <th>Email</th>
                <th style="width: 160px">Phone</th>
                <th style="width: 60px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contact in contacts" :key="contact.id">
                <td>
                  <InlineEditCell
                    :model-value="contact.firstName"
                    @commit="(v) => updateContact(contact, 'firstName', String(v))"
                  />
                </td>
                <td>
                  <InlineEditCell
                    :model-value="contact.lastName"
                    @commit="(v) => updateContact(contact, 'lastName', String(v))"
                  />
                </td>
                <td>
                  <InlineEditCell
                    :model-value="contact.email"
                    @commit="(v) => updateContact(contact, 'email', String(v))"
                  />
                </td>
                <td>
                  <InlineEditCell
                    :model-value="contact.phone"
                    @commit="(v) => updateContact(contact, 'phone', String(v))"
                  />
                </td>
                <td>
                  <Btn variant="ghost" icon="trash" @click="deleteContact(contact)" />
                </td>
              </tr>
              <tr v-if="contacts.length === 0">
                <td colspan="5">
                  <div class="swift-empty">No contacts yet.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Locations table -->
        <div v-if="activeTab === 'overview' || activeTab === 'locations'" class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Locations</span>
            <span class="count" style="margin-left: 6px">{{ locations.length }}</span>
            <div style="flex: 1" />
            <Btn icon="plus" @click="addLocation">Add location</Btn>
          </div>
          <table class="swift-table">
            <thead>
              <tr>
                <th>Address</th>
                <th style="width: 140px">City</th>
                <th style="width: 80px">State</th>
                <th style="width: 100px">Postcode</th>
                <th style="width: 120px">Country</th>
                <th style="width: 60px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="loc in locations" :key="loc.id">
                <td>
                  <InlineEditCell
                    :model-value="loc.addressLine1"
                    @commit="(v) => updateLocation(loc, 'addressLine1', String(v))"
                  />
                </td>
                <td>
                  <InlineEditCell
                    :model-value="loc.city"
                    @commit="(v) => updateLocation(loc, 'city', String(v))"
                  />
                </td>
                <td>
                  <InlineEditCell
                    :model-value="loc.state"
                    @commit="(v) => updateLocation(loc, 'state', String(v))"
                  />
                </td>
                <td>
                  <InlineEditCell
                    :model-value="loc.zipCode"
                    @commit="(v) => updateLocation(loc, 'zipCode', String(v))"
                  />
                </td>
                <td>
                  <InlineEditCell
                    :model-value="loc.country"
                    @commit="(v) => updateLocation(loc, 'country', String(v))"
                  />
                </td>
                <td>
                  <Btn variant="ghost" icon="trash" @click="deleteLocation(loc)" />
                </td>
              </tr>
              <tr v-if="locations.length === 0">
                <td colspan="6">
                  <div class="swift-empty">No locations yet.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Proposals — preview -->
        <div v-if="activeTab === 'proposals'" class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Proposals</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            Per-customer proposal listing requires backend support.
          </div>
        </div>

        <!-- Audit — preview -->
        <div v-if="activeTab === 'audit'" class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Recent activity</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            Audit log requires backend support.
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0">

        <!-- Recent activity -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Recent activity</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            Activity feed requires backend support.
          </div>
        </div>

        <!-- Tags / Notes -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Tags & notes</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            Tags & notes require backend support.
          </div>
        </div>

        <!-- Where used -->
        <div class="swift-panel">
          <div class="swift-panel__header">
            <span style="font-weight: 500">Where used</span>
            <Tag kind="warn">preview</Tag>
          </div>
          <div style="padding: 12px; color: var(--text-3); font-size: 12px">
            Proposal count and revenue rollup require backend support.
          </div>
        </div>
      </div>
    </div>

    <StatusBar>
      <span><span class="swift-status-dot" :style="{ background: saving ? 'var(--warn)' : 'var(--success)' }" />&nbsp;{{ saving ? 'saving' : 'saved' }}</span>
      <template #right>
        <span>⌘S save · esc back</span>
      </template>
    </StatusBar>

    <!-- New contact dialog -->
    <Dialog v-model:visible="contactDialogVisible" header="Add contact" modal style="width: 480px">
      <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <div>
            <label class="swift-label">First name *</label>
            <input v-model="contactForm.firstName" class="swift-input" style="width: 100%" />
          </div>
          <div>
            <label class="swift-label">Last name *</label>
            <input v-model="contactForm.lastName" class="swift-input" style="width: 100%" />
          </div>
        </div>
        <div>
          <label class="swift-label">Email *</label>
          <input v-model="contactForm.email" class="swift-input" style="width: 100%" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <div>
            <label class="swift-label">Phone *</label>
            <input v-model="contactForm.phone" class="swift-input mono" style="width: 100%" />
          </div>
          <div>
            <label class="swift-label">Role *</label>
            <input v-model="contactForm.role" class="swift-input" placeholder="e.g. primary" style="width: 100%" />
          </div>
        </div>
        <div v-if="contactError" style="color: var(--error); font-size: 12px">{{ contactError }}</div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <Btn @click="contactDialogVisible = false">Cancel</Btn>
          <Btn variant="primary" @click="submitContact">Add</Btn>
        </div>
      </template>
    </Dialog>

    <!-- New location dialog -->
    <Dialog v-model:visible="locationDialogVisible" header="Add location" modal style="width: 480px">
      <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px">
        <div>
          <label class="swift-label">Address *</label>
          <input v-model="locationForm.addressLine1" class="swift-input" style="width: 100%" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <div>
            <label class="swift-label">City *</label>
            <input v-model="locationForm.city" class="swift-input" style="width: 100%" />
          </div>
          <div>
            <label class="swift-label">State *</label>
            <input v-model="locationForm.state" class="swift-input" style="width: 100%" />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <div>
            <label class="swift-label">Postcode *</label>
            <input v-model="locationForm.zipCode" class="swift-input mono" style="width: 100%" />
          </div>
          <div>
            <label class="swift-label">Country *</label>
            <input v-model="locationForm.country" class="swift-input" style="width: 100%" />
          </div>
        </div>
        <div v-if="locationError" style="color: var(--error); font-size: 12px">{{ locationError }}</div>
      </div>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <Btn @click="locationDialogVisible = false">Cancel</Btn>
          <Btn variant="primary" @click="submitLocation">Add</Btn>
        </div>
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';
import Dialog from 'primevue/dialog';

import TopBar from '../ui/TopBar.vue';
import StatusBar from '../ui/StatusBar.vue';
import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';
import Stat from '../ui/Stat.vue';
import InlineEditCell from '../ui/InlineEditCell.vue';

import {
  GetCustomerById, UpdateCustomer, DeleteCustomer,
  CreateCustomerContact, UpdateCustomerContact, DeleteCustomerContact,
  CreateCustomerLocation, UpdateCustomerLocation, DeleteCustomerLocation,
} from '../api/api';

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface LocationRow {
  id: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdOnDate: string;
  modifiedOnDate: string;
  contacts: ContactRow[];
  locations: LocationRow[];
}

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const customer = ref<CustomerDetail | null>(null);
const contacts = ref<ContactRow[]>([]);
const locations = ref<LocationRow[]>([]);
const loading = ref(true);
const saving = ref(false);
const activeTab = ref('overview');

const form = ref({ name: '', email: '', phone: '' });

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', count: null },
  { id: 'contacts', label: 'Contacts', count: contacts.value.length },
  { id: 'locations', label: 'Locations', count: locations.value.length },
  { id: 'proposals', label: 'Proposals', count: null },
  { id: 'audit', label: 'Audit log', count: null },
]);

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function load() {
  loading.value = true;
  try {
    const data = await GetCustomerById(route.params.id as string);
    if (!data) return;
    customer.value = data;
    contacts.value = data.contacts ?? [];
    locations.value = data.locations ?? [];
    form.value = { name: data.name, email: data.email ?? '', phone: data.phone ?? '' };
  } finally {
    loading.value = false;
  }
}

async function saveIdentity() {
  if (!customer.value) return;
  if (!form.value.name.trim()) {
    toast.add({ severity: 'error', summary: 'Name required', life: 3000 });
    return;
  }
  saving.value = true;
  try {
    const updated = await UpdateCustomer(customer.value.id, form.value);
    if (!updated) throw new Error();
    customer.value = { ...customer.value, ...updated };
    toast.add({ severity: 'success', summary: 'Saved', life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Save failed', life: 3000 });
  } finally {
    saving.value = false;
  }
}

function confirmDelete() {
  if (!customer.value) return;
  const c = customer.value;
  confirm.require({
    message: `Delete "${c.name}"? This cannot be undone.`,
    header: 'Confirm delete',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      const ok = await DeleteCustomer(c.id);
      if (ok) {
        toast.add({ severity: 'success', summary: 'Deleted', life: 2000 });
        router.push('/customers');
      } else {
        toast.add({ severity: 'error', summary: 'Delete failed', life: 3000 });
      }
    },
  });
}

const contactDialogVisible = ref(false);
const contactError = ref('');
const contactForm = ref({ firstName: '', lastName: '', email: '', phone: '', role: 'primary' });

function addContact() {
  contactForm.value = { firstName: '', lastName: '', email: '', phone: '', role: 'primary' };
  contactError.value = '';
  contactDialogVisible.value = true;
}

async function submitContact() {
  if (!customer.value) return;
  contactError.value = '';
  const f = contactForm.value;
  if (!f.firstName.trim() || !f.lastName.trim() || !f.email.trim() || !f.phone.trim() || !f.role.trim()) {
    contactError.value = 'All fields are required.';
    return;
  }
  const created = await CreateCustomerContact(customer.value.id, f);
  if (created) {
    contacts.value.push(created);
    contactDialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Contact added', life: 2000 });
  } else {
    contactError.value = 'Failed to add contact.';
  }
}

async function updateContact(contact: ContactRow, field: keyof ContactRow, value: string) {
  if (!customer.value) return;
  const updated = await UpdateCustomerContact(customer.value.id, contact.id, { [field]: value });
  if (updated) {
    const idx = contacts.value.findIndex((c) => c.id === contact.id);
    if (idx !== -1) contacts.value[idx] = { ...contacts.value[idx], ...updated };
  }
}

async function deleteContact(contact: ContactRow) {
  if (!customer.value) return;
  const ok = await DeleteCustomerContact(customer.value.id, contact.id);
  if (ok) {
    contacts.value = contacts.value.filter((c) => c.id !== contact.id);
    toast.add({ severity: 'success', summary: 'Contact removed', life: 2000 });
  }
}

const locationDialogVisible = ref(false);
const locationError = ref('');
const locationForm = ref({ addressLine1: '', city: '', state: '', zipCode: '', country: '' });

function addLocation() {
  locationForm.value = { addressLine1: '', city: '', state: '', zipCode: '', country: '' };
  locationError.value = '';
  locationDialogVisible.value = true;
}

async function submitLocation() {
  if (!customer.value) return;
  locationError.value = '';
  const f = locationForm.value;
  if (!f.addressLine1.trim() || !f.city.trim() || !f.state.trim() || !f.zipCode.trim() || !f.country.trim()) {
    locationError.value = 'All fields are required.';
    return;
  }
  const created = await CreateCustomerLocation(customer.value.id, f);
  if (created) {
    locations.value.push(created);
    locationDialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Location added', life: 2000 });
  } else {
    locationError.value = 'Failed to add location.';
  }
}

async function updateLocation(location: LocationRow, field: keyof LocationRow, value: string) {
  if (!customer.value) return;
  const updated = await UpdateCustomerLocation(customer.value.id, location.id, { [field]: value });
  if (updated) {
    const idx = locations.value.findIndex((l) => l.id === location.id);
    if (idx !== -1) locations.value[idx] = { ...locations.value[idx], ...updated };
  }
}

async function deleteLocation(location: LocationRow) {
  if (!customer.value) return;
  const ok = await DeleteCustomerLocation(customer.value.id, location.id);
  if (ok) {
    locations.value = locations.value.filter((l) => l.id !== location.id);
    toast.add({ severity: 'success', summary: 'Location removed', life: 2000 });
  }
}

onMounted(load);
</script>
