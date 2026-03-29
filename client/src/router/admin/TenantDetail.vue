<template>
  <div id="tenant-detail-page">
    <Toolbar class="tenant-toolbar m-2 mt-0 !border-none">
      <template #start>
        <div class="flex items-center gap-3">
          <Button icon="pi pi-arrow-left" text size="small" @click="router.push('/admin/tenants')" v-tooltip="'Back'" />
          <h1 class="m-0 text-3xl">{{ tenant?.name ?? 'Tenant' }}</h1>
          <Tag v-if="tenant" :value="tenant.status" :severity="statusSeverity(tenant.status)" />
        </div>
      </template>
      <template #end>
        <div v-if="tenant" class="flex gap-2">
          <Button
            v-if="tenant.status === 'ACTIVE'"
            label="Suspend"
            icon="pi pi-ban"
            size="small"
            severity="danger"
            @click="openSuspend"
          />
          <Button
            v-else-if="tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE'"
            label="Activate"
            icon="pi pi-check-circle"
            size="small"
            severity="success"
            @click="handleActivate"
          />
        </div>
      </template>
    </Toolbar>

    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="tenant" class="m-2 max-w-5xl">
      <!-- Overview -->
      <div class="grid grid-cols-2 gap-4">
        <Card>
          <template #title>Overview</template>
          <template #content>
            <div class="flex flex-col gap-3">
              <div><span class="text-sm text-gray-500">Subdomain:</span> <span class="font-medium">{{ tenant.subdomain }}</span></div>
              <div><span class="text-sm text-gray-500">Status:</span> <Tag :value="tenant.status" :severity="statusSeverity(tenant.status)" /></div>
              <div v-if="tenant.statusReason"><span class="text-sm text-gray-500">Reason:</span> <span>{{ tenant.statusReason }}</span></div>
              <div><span class="text-sm text-gray-500">Users:</span> <span class="font-medium">{{ tenant.userCount }}</span></div>
              <div><span class="text-sm text-gray-500">Admin:</span>
                <span v-if="tenant.adminUser" class="font-medium">{{ tenant.adminUser.firstName }} {{ tenant.adminUser.lastName }} ({{ tenant.adminUser.username }})</span>
                <span v-else class="text-gray-400">Not set</span>
              </div>
              <div><span class="text-sm text-gray-500">Created:</span> <span>{{ new Date(tenant.createdOnDate).toLocaleString() }}</span></div>
            </div>
          </template>
        </Card>

        <Card v-if="tenant.settings">
          <template #title>Settings</template>
          <template #content>
            <div class="flex flex-col gap-3">
              <div><span class="text-sm text-gray-500">Prefix:</span> <span class="font-medium">{{ tenant.settings.prefix }}</span></div>
              <div><span class="text-sm text-gray-500">Currency:</span> <span class="font-medium">{{ tenant.settings.currency }}</span></div>
              <div><span class="text-sm text-gray-500">Timezone:</span> <span class="font-medium">{{ tenant.settings.timezone }}</span></div>
              <div><span class="text-sm text-gray-500">Date Format:</span> <span class="font-medium">{{ tenant.settings.dateFormat }}</span></div>
              <div><span class="text-sm text-gray-500">Stale Inventory Days:</span> <span class="font-medium">{{ tenant.settings.staleInventoryDays }}</span></div>
            </div>
          </template>
        </Card>
      </div>

      <div class="grid grid-cols-2 gap-4 mt-4">
        <Card v-if="tenant.theme">
          <template #title>Theme</template>
          <template #content>
            <div class="flex gap-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded border" :style="{ backgroundColor: tenant.theme.primary }"></div>
                <span class="text-sm">Primary</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded border" :style="{ backgroundColor: tenant.theme.secondary }"></div>
                <span class="text-sm">Secondary</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded border" :style="{ backgroundColor: tenant.theme.accent }"></div>
                <span class="text-sm">Accent</span>
              </div>
            </div>
          </template>
        </Card>

        <Card v-if="tenant.proposalSettings">
          <template #title>Proposal Defaults</template>
          <template #content>
            <div class="flex flex-col gap-3">
              <div><span class="text-sm text-gray-500">Expiry Days:</span> <span class="font-medium">{{ tenant.proposalSettings.expiry }}</span></div>
              <div><span class="text-sm text-gray-500">Tax Enabled:</span> <span class="font-medium">{{ tenant.proposalSettings.tax ? 'Yes' : 'No' }}</span></div>
              <div><span class="text-sm text-gray-500">Tax Rate:</span> <span class="font-medium">{{ tenant.proposalSettings.taxRate }}%</span></div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Users -->
      <Card class="mt-4">
        <template #title>Users ({{ users.length }})</template>
        <template #content>
          <DataTable :value="users" :loading="usersLoading" size="small" striped-rows data-key="id">
            <template #empty>
              <div class="text-center py-6">
                <p class="text-gray-500">No users in this tenant.</p>
              </div>
            </template>
            <Column field="username" header="Username" />
            <Column field="firstName" header="First Name" />
            <Column field="lastName" header="Last Name" />
            <Column field="authProvider" header="Auth" style="width: 100px" />
            <Column header="Status" style="width: 100px">
              <template #body="{ data }">
                <Tag :value="data.isActive ? 'Active' : 'Inactive'" :severity="data.isActive ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column header="Created" style="width: 150px">
              <template #body="{ data }">
                {{ new Date(data.createdOnDate).toLocaleDateString() }}
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Suspend Dialog -->
    <Dialog v-model:visible="suspendDialogVisible" header="Suspend Tenant" modal style="width: 480px">
      <div class="flex flex-col gap-4 pt-2">
        <p class="text-sm text-gray-600">
          Suspending <strong>{{ tenant?.name }}</strong> will prevent all users from accessing this tenant.
        </p>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Reason <span class="text-red-500">*</span></label>
          <Textarea v-model="suspendReason" rows="3" fluid />
        </div>
        <Message v-if="suspendError" severity="error" :closable="false">{{ suspendError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="suspendDialogVisible = false" />
        <Button label="Suspend" severity="danger" :loading="actionLoading" @click="submitSuspend" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

import { AdminGetTenantById, AdminGetTenantUsers, AdminSuspendTenant, AdminActivateTenant } from '../../api/api';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const tenant = ref<TenantDetail | null>(null);
const users = ref<TenantUser[]>([]);
const loading = ref(true);
const usersLoading = ref(false);
const actionLoading = ref(false);

const suspendDialogVisible = ref(false);
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

async function loadTenant() {
  loading.value = true;
  try {
    const id = route.params.id as string;
    tenant.value = await AdminGetTenantById(id);
  } finally {
    loading.value = false;
  }
}

async function loadUsers() {
  usersLoading.value = true;
  try {
    const id = route.params.id as string;
    users.value = (await AdminGetTenantUsers(id)) ?? [];
  } finally {
    usersLoading.value = false;
  }
}

function openSuspend() {
  suspendReason.value = '';
  suspendError.value = '';
  suspendDialogVisible.value = true;
}

async function submitSuspend() {
  if (!tenant.value) return;
  suspendError.value = '';

  if (!suspendReason.value.trim()) {
    suspendError.value = 'Reason is required';
    return;
  }

  actionLoading.value = true;
  try {
    const result = await AdminSuspendTenant(tenant.value.id, suspendReason.value);
    if (!result) {
      suspendError.value = 'Failed to suspend tenant';
      return;
    }
    toast.add({ severity: 'warn', summary: 'Suspended', detail: `${tenant.value.name} has been suspended`, life: 3000 });
    suspendDialogVisible.value = false;
    await loadTenant();
  } finally {
    actionLoading.value = false;
  }
}

async function handleActivate() {
  if (!tenant.value) return;
  actionLoading.value = true;
  try {
    const result = await AdminActivateTenant(tenant.value.id);
    if (result) {
      toast.add({ severity: 'success', summary: 'Activated', detail: `${tenant.value.name} has been activated`, life: 3000 });
      await loadTenant();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to activate tenant', life: 3000 });
    }
  } finally {
    actionLoading.value = false;
  }
}

onMounted(async () => {
  await loadTenant();
  await loadUsers();
});
</script>

<style scoped>
#tenant-detail-page {
  min-height: 100vh;
}

.tenant-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
