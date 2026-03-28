<template>
  <div id="customers-page">
    <Toolbar class="customers-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">Customers</h1>
      </template>
      <template #end>
        <Button label="New Customer" icon="pi pi-plus" size="small" severity="contrast" @click="openCreate" />
      </template>
    </Toolbar>

    <div class="m-2">
      <DataTable :value="customers" :loading="loading" size="small" striped-rows data-key="id">
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No customers yet.</p>
            <Button label="Add your first customer" size="small" severity="contrast" class="mt-3" @click="openCreate" />
          </div>
        </template>
        <Column field="name" header="Name" />
        <Column field="email" header="Email" />
        <Column field="phone" header="Phone" />
        <Column style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" size="small" text @click="openEdit(data)" v-tooltip="'Edit'" />
              <Button icon="pi pi-trash" size="small" text severity="danger" @click="confirmDelete(data)" v-tooltip="'Delete'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create Dialog -->
    <Dialog v-model:visible="createDialogVisible" header="New Customer" modal style="width: 480px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Name <span class="text-red-500">*</span></label>
          <InputText v-model="createForm.name" placeholder="Acme Corp" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Email</label>
          <InputText v-model="createForm.email" placeholder="contact@acme.com" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Phone</label>
          <InputText v-model="createForm.phone" placeholder="+61 2 0000 0000" fluid />
        </div>
        <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="createDialogVisible = false" />
        <Button label="Create" :loading="saving" @click="submitCreate" />
      </template>
    </Dialog>

    <!-- Edit Dialog with tabs -->
    <Dialog v-model:visible="editDialogVisible" :header="editingCustomer ? `Edit: ${editingCustomer.name}` : ''" modal style="width: 640px">
      <Tabs v-model:value="editTab">
        <TabList>
          <Tab value="details">Details</Tab>
          <Tab value="contacts">Contacts</Tab>
          <Tab value="locations">Locations</Tab>
        </TabList>

        <!-- Details Tab -->
        <TabPanel value="details">
          <div class="flex flex-col gap-4 pt-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Name <span class="text-red-500">*</span></label>
              <InputText v-model="editForm.name" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Email</label>
              <InputText v-model="editForm.email" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Phone</label>
              <InputText v-model="editForm.phone" fluid />
            </div>
            <Message v-if="editError" severity="error" :closable="false">{{ editError }}</Message>
            <div class="flex justify-end gap-2 mt-2">
              <Button label="Save Details" :loading="saving" @click="submitEdit" />
            </div>
          </div>
        </TabPanel>

        <!-- Contacts Tab -->
        <TabPanel value="contacts">
          <div class="pt-3">
            <div class="flex justify-end mb-2">
              <Button label="Add Contact" icon="pi pi-plus" size="small" severity="contrast" @click="openAddContact" />
            </div>
            <DataTable :value="contacts" size="small" striped-rows data-key="id">
              <template #empty><p class="text-center text-gray-500 py-4">No contacts.</p></template>
              <Column field="name" header="Name" />
              <Column field="email" header="Email" />
              <Column field="phone" header="Phone" />
              <Column style="width: 80px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button icon="pi pi-pencil" size="small" text @click="openEditContact(data)" />
                    <Button icon="pi pi-trash" size="small" text severity="danger" @click="deleteContact(data)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>

        <!-- Locations Tab -->
        <TabPanel value="locations">
          <div class="pt-3">
            <div class="flex justify-end mb-2">
              <Button label="Add Location" icon="pi pi-plus" size="small" severity="contrast" @click="openAddLocation" />
            </div>
            <DataTable :value="locations" size="small" striped-rows data-key="id">
              <template #empty><p class="text-center text-gray-500 py-4">No locations.</p></template>
              <Column field="street" header="Street" />
              <Column field="city" header="City" />
              <Column field="state" header="State" />
              <Column field="country" header="Country" />
              <Column style="width: 80px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button icon="pi pi-pencil" size="small" text @click="openEditLocation(data)" />
                    <Button icon="pi pi-trash" size="small" text severity="danger" @click="deleteLocation(data)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>
      </Tabs>
    </Dialog>

    <!-- Contact sub-dialog -->
    <Dialog v-model:visible="contactDialogVisible" :header="editingContact ? 'Edit Contact' : 'Add Contact'" modal style="width: 420px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Name <span class="text-red-500">*</span></label>
          <InputText v-model="contactForm.name" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Email</label>
          <InputText v-model="contactForm.email" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Phone</label>
          <InputText v-model="contactForm.phone" fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="contactDialogVisible = false" />
        <Button :label="editingContact ? 'Save' : 'Add'" :loading="saving" @click="submitContact" />
      </template>
    </Dialog>

    <!-- Location sub-dialog -->
    <Dialog v-model:visible="locationDialogVisible" :header="editingLocation ? 'Edit Location' : 'Add Location'" modal style="width: 420px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Street</label>
          <InputText v-model="locationForm.street" fluid />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">City</label>
            <InputText v-model="locationForm.city" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">State</label>
            <InputText v-model="locationForm.state" fluid />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Country</label>
          <InputText v-model="locationForm.country" fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="locationDialogVisible = false" />
        <Button :label="editingLocation ? 'Save' : 'Add'" :loading="saving" @click="submitLocation" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanel from 'primevue/tabpanel';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';

import {
  GetCustomers, CreateCustomer, UpdateCustomer, DeleteCustomer,
  GetCustomerById,
  CreateCustomerContact, UpdateCustomerContact, DeleteCustomerContact,
  CreateCustomerLocation, UpdateCustomerLocation, DeleteCustomerLocation,
} from '../api/api';

const confirm = useConfirm();
const toast = useToast();

// ── List state ──────────────────────────────────────────────────────────────
const customers = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);

// ── Create dialog ────────────────────────────────────────────────────────────
const createDialogVisible = ref(false);
const createError = ref('');
const createForm = ref({ name: '', email: '', phone: '' });

// ── Edit dialog ──────────────────────────────────────────────────────────────
const editDialogVisible = ref(false);
const editingCustomer = ref<any>(null);
const editTab = ref('details');
const editError = ref('');
const editForm = ref({ name: '', email: '', phone: '' });
const contacts = ref<any[]>([]);
const locations = ref<any[]>([]);

// ── Contact sub-dialog ────────────────────────────────────────────────────────
const contactDialogVisible = ref(false);
const editingContact = ref<any>(null);
const contactForm = ref({ name: '', email: '', phone: '' });

// ── Location sub-dialog ───────────────────────────────────────────────────────
const locationDialogVisible = ref(false);
const editingLocation = ref<any>(null);
const locationForm = ref({ street: '', city: '', state: '', country: '' });

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadCustomers() {
  loading.value = true;
  try {
    customers.value = (await GetCustomers()) ?? [];
  } finally {
    loading.value = false;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────
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

// ── Edit ──────────────────────────────────────────────────────────────────────
async function openEdit(customer: any) {
  editingCustomer.value = customer;
  editForm.value = { name: customer.name, email: customer.email ?? '', phone: customer.phone ?? '' };
  editError.value = '';
  editTab.value = 'details';
  contacts.value = [];
  locations.value = [];
  editDialogVisible.value = true;

  // Load full customer detail with contacts/locations
  const full = await GetCustomerById(customer.id);
  if (full) {
    contacts.value = full.contacts ?? [];
    locations.value = full.locations ?? [];
  }
}

async function submitEdit() {
  editError.value = '';
  if (!editForm.value.name.trim()) {
    editError.value = 'Name is required.';
    return;
  }
  saving.value = true;
  try {
    const updated = await UpdateCustomer(editingCustomer.value.id, editForm.value);
    if (!updated) throw new Error();
    const idx = customers.value.findIndex((c) => c.id === editingCustomer.value.id);
    if (idx !== -1) customers.value[idx] = { ...customers.value[idx], ...updated };
    editingCustomer.value = { ...editingCustomer.value, ...updated };
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Customer updated', life: 3000 });
  } catch {
    editError.value = 'Failed to save changes.';
  } finally {
    saving.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function confirmDelete(customer: any) {
  confirm.require({
    message: `Delete "${customer.name}"? This cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      const ok = await DeleteCustomer(customer.id);
      if (ok) {
        customers.value = customers.value.filter((c) => c.id !== customer.id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Customer removed', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
      }
    },
  });
}

// ── Contacts ──────────────────────────────────────────────────────────────────
function openAddContact() {
  editingContact.value = null;
  contactForm.value = { name: '', email: '', phone: '' };
  contactDialogVisible.value = true;
}

function openEditContact(contact: any) {
  editingContact.value = contact;
  contactForm.value = { name: contact.name, email: contact.email ?? '', phone: contact.phone ?? '' };
  contactDialogVisible.value = true;
}

async function submitContact() {
  saving.value = true;
  try {
    if (editingContact.value) {
      const updated = await UpdateCustomerContact(editingCustomer.value.id, editingContact.value.id, contactForm.value);
      if (updated) {
        const idx = contacts.value.findIndex((c) => c.id === editingContact.value.id);
        if (idx !== -1) contacts.value[idx] = updated;
        toast.add({ severity: 'success', summary: 'Saved', detail: 'Contact updated', life: 3000 });
      }
    } else {
      const created = await CreateCustomerContact(editingCustomer.value.id, contactForm.value);
      if (created) {
        contacts.value.push(created);
        toast.add({ severity: 'success', summary: 'Added', detail: 'Contact added', life: 3000 });
      }
    }
    contactDialogVisible.value = false;
  } finally {
    saving.value = false;
  }
}

async function deleteContact(contact: any) {
  const ok = await DeleteCustomerContact(editingCustomer.value.id, contact.id);
  if (ok) {
    contacts.value = contacts.value.filter((c) => c.id !== contact.id);
    toast.add({ severity: 'success', summary: 'Removed', detail: 'Contact removed', life: 3000 });
  }
}

// ── Locations ─────────────────────────────────────────────────────────────────
function openAddLocation() {
  editingLocation.value = null;
  locationForm.value = { street: '', city: '', state: '', country: '' };
  locationDialogVisible.value = true;
}

function openEditLocation(location: any) {
  editingLocation.value = location;
  locationForm.value = {
    street: location.street ?? '',
    city: location.city ?? '',
    state: location.state ?? '',
    country: location.country ?? '',
  };
  locationDialogVisible.value = true;
}

async function submitLocation() {
  saving.value = true;
  try {
    if (editingLocation.value) {
      const updated = await UpdateCustomerLocation(editingCustomer.value.id, editingLocation.value.id, locationForm.value);
      if (updated) {
        const idx = locations.value.findIndex((l) => l.id === editingLocation.value.id);
        if (idx !== -1) locations.value[idx] = updated;
        toast.add({ severity: 'success', summary: 'Saved', detail: 'Location updated', life: 3000 });
      }
    } else {
      const created = await CreateCustomerLocation(editingCustomer.value.id, locationForm.value);
      if (created) {
        locations.value.push(created);
        toast.add({ severity: 'success', summary: 'Added', detail: 'Location added', life: 3000 });
      }
    }
    locationDialogVisible.value = false;
  } finally {
    saving.value = false;
  }
}

async function deleteLocation(location: any) {
  const ok = await DeleteCustomerLocation(editingCustomer.value.id, location.id);
  if (ok) {
    locations.value = locations.value.filter((l) => l.id !== location.id);
    toast.add({ severity: 'success', summary: 'Removed', detail: 'Location removed', life: 3000 });
  }
}

onMounted(() => loadCustomers());
</script>

<style scoped>
#customers-page {
  min-height: 100vh;
}

.customers-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
