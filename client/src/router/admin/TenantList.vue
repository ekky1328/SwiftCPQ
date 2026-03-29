<template>
  <div id="tenants-page">
    <Toolbar class="tenants-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">Tenants</h1>
      </template>
      <template #end>
        <Button label="New Tenant" icon="pi pi-plus" size="small" severity="contrast" @click="router.push('/admin/tenants/new')" />
      </template>
    </Toolbar>

    <div class="m-2">
      <DataTable :value="tenants" :loading="loading" size="small" striped-rows data-key="id">
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No tenants found.</p>
          </div>
        </template>
        <Column header="Name">
          <template #body="{ data }">
            <router-link :to="`/admin/tenants/${data.id}`" class="text-blue-600 hover:underline font-medium">
              {{ data.name }}
            </router-link>
          </template>
        </Column>
        <Column field="subdomain" header="Subdomain" />
        <Column header="Status" style="width: 130px">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <Column field="userCount" header="Users" style="width: 80px" />
        <Column header="Admin" style="width: 200px">
          <template #body="{ data }">
            <span v-if="data.adminUser">{{ data.adminUser.firstName }} {{ data.adminUser.lastName }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>
        <Column header="Created" style="width: 150px">
          <template #body="{ data }">
            {{ new Date(data.createdOnDate).toLocaleDateString() }}
          </template>
        </Column>
        <Column style="width: 130px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" size="small" text @click="openEdit(data)" v-tooltip="'Edit'" />
              <Button
                v-if="data.status === 'ACTIVE'"
                icon="pi pi-ban"
                size="small"
                text
                severity="danger"
                @click="openSuspend(data)"
                v-tooltip="'Suspend'"
              />
              <Button
                v-else-if="data.status === 'SUSPENDED' || data.status === 'INACTIVE'"
                icon="pi pi-check-circle"
                size="small"
                text
                severity="success"
                @click="handleActivate(data)"
                v-tooltip="'Activate'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:visible="editDialogVisible" header="Edit Tenant" modal style="width: 480px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Name <span class="text-red-500">*</span></label>
          <InputText v-model="editForm.name" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Subdomain <span class="text-red-500">*</span></label>
          <InputText v-model="editForm.subdomain" fluid />
        </div>
        <Message v-if="editError" severity="error" :closable="false">{{ editError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="editDialogVisible = false" />
        <Button label="Save" :loading="saving" @click="submitEdit" />
      </template>
    </Dialog>

    <!-- Suspend Dialog -->
    <Dialog v-model:visible="suspendDialogVisible" header="Suspend Tenant" modal style="width: 480px">
      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-gray-600">
          Suspending <strong>{{ suspendingTenant?.name }}</strong> will prevent all users from accessing this tenant.
        </p>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Reason <span class="text-red-500">*</span></label>
          <Textarea v-model="suspendReason" rows="3" fluid />
        </div>
        <Message v-if="suspendError" severity="error" :closable="false">{{ suspendError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="suspendDialogVisible = false" />
        <Button label="Suspend" severity="danger" :loading="saving" @click="submitSuspend" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Message from 'primevue/message';

import { AdminGetTenants, AdminUpdateTenant, AdminSuspendTenant, AdminActivateTenant } from '../../api/api';

const router = useRouter();
const toast = useToast();

const tenants = ref<TenantListItem[]>([]);
const loading = ref(false);
const saving = ref(false);

// Edit
const editDialogVisible = ref(false);
const editingTenant = ref<TenantListItem | null>(null);
const editForm = ref({ name: '', subdomain: '' });
const editError = ref('');

// Suspend
const suspendDialogVisible = ref(false);
const suspendingTenant = ref<TenantListItem | null>(null);
const suspendReason = ref('');
const suspendError = ref('');

function statusSeverity(status: string) {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'SUSPENDED': return 'danger';
    case 'PENDING': return 'warn';
    case 'INACTIVE': return 'secondary';
    default: return 'info';
  }
}

async function loadTenants() {
  loading.value = true;
  try {
    tenants.value = (await AdminGetTenants()) ?? [];
  } finally {
    loading.value = false;
  }
}

function openEdit(tenant: TenantListItem) {
  editingTenant.value = tenant;
  editForm.value = { name: tenant.name, subdomain: tenant.subdomain };
  editError.value = '';
  editDialogVisible.value = true;
}

async function submitEdit() {
  if (!editingTenant.value) return;
  editError.value = '';

  if (!editForm.value.name.trim()) {
    editError.value = 'Name is required';
    return;
  }

  saving.value = true;
  try {
    const result = await AdminUpdateTenant(editingTenant.value.id, editForm.value);
    if (result?.error) {
      editError.value = result.message;
      return;
    }
    if (!result) {
      editError.value = 'Failed to update tenant';
      return;
    }
    toast.add({ severity: 'success', summary: 'Updated', detail: 'Tenant updated', life: 3000 });
    editDialogVisible.value = false;
    await loadTenants();
  } finally {
    saving.value = false;
  }
}

function openSuspend(tenant: TenantListItem) {
  suspendingTenant.value = tenant;
  suspendReason.value = '';
  suspendError.value = '';
  suspendDialogVisible.value = true;
}

async function submitSuspend() {
  if (!suspendingTenant.value) return;
  suspendError.value = '';

  if (!suspendReason.value.trim()) {
    suspendError.value = 'Reason is required';
    return;
  }

  saving.value = true;
  try {
    const result = await AdminSuspendTenant(suspendingTenant.value.id, suspendReason.value);
    if (!result) {
      suspendError.value = 'Failed to suspend tenant';
      return;
    }
    toast.add({ severity: 'warn', summary: 'Suspended', detail: `${suspendingTenant.value.name} has been suspended`, life: 3000 });
    suspendDialogVisible.value = false;
    await loadTenants();
  } finally {
    saving.value = false;
  }
}

async function handleActivate(tenant: TenantListItem) {
  const result = await AdminActivateTenant(tenant.id);
  if (result) {
    toast.add({ severity: 'success', summary: 'Activated', detail: `${tenant.name} has been activated`, life: 3000 });
    await loadTenants();
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to activate tenant', life: 3000 });
  }
}

onMounted(() => loadTenants());
</script>

<style scoped>
#tenants-page {
  min-height: 100vh;
}

.tenants-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
