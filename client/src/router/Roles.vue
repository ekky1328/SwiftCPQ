<template>
  <div id="roles-page">
    <Toolbar class="roles-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">Roles &amp; Permissions</h1>
      </template>
      <template #end>
        <Button label="New Role" icon="pi pi-plus" size="small" severity="contrast" @click="openCreate" />
      </template>
    </Toolbar>

    <div class="m-2">
      <DataTable :value="roles" :loading="loading" size="small" striped-rows data-key="id">
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No roles defined yet.</p>
          </div>
        </template>
        <Column field="name" header="Role Name" />
        <Column header="Permissions" style="width: 160px">
          <template #body="{ data }">
            <Badge :value="String(data.permissions?.length ?? 0)" severity="info" />
          </template>
        </Column>
        <Column header="Users" style="width: 100px">
          <template #body="{ data }">
            <Badge :value="String(data.users?.length ?? 0)" severity="secondary" />
          </template>
        </Column>
        <Column style="width: 100px">
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
    <Dialog v-model:visible="createDialogVisible" header="New Role" modal style="width: 420px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Role Name <span class="text-red-500">*</span></label>
          <InputText v-model="createName" placeholder="e.g. Sales Manager" fluid />
        </div>
        <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="createDialogVisible = false" />
        <Button label="Create" :loading="saving" @click="submitCreate" />
      </template>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:visible="editDialogVisible" :header="editingRole ? `Edit: ${editingRole.name}` : ''" modal style="width: 640px">
      <Tabs v-model:value="editTab">
        <TabList>
          <Tab value="permissions">Permissions</Tab>
          <Tab value="users">Users</Tab>
        </TabList>

        <!-- Permissions Tab -->
        <TabPanel value="permissions">
          <div class="pt-3">
            <p v-if="allPermissions.length === 0" class="text-gray-500 text-sm">Loading permissions...</p>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="perm in allPermissions"
                :key="perm.name"
                class="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
              >
                <Checkbox
                  v-model="assignedPermNames"
                  :value="perm.name"
                  :inputId="`perm-${perm.name}`"
                  @change="onPermissionToggle(perm)"
                />
                <label :for="`perm-${perm.name}`" class="text-sm cursor-pointer flex-1">
                  <span class="font-medium">{{ perm.name }}</span>
                  <span v-if="perm.description" class="text-gray-500 ml-2">— {{ perm.description }}</span>
                </label>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Users Tab -->
        <TabPanel value="users">
          <div class="pt-3">
            <div class="flex gap-2 mb-3">
              <Select
                v-model="selectedUserId"
                :options="availableUsers"
                option-label="username"
                option-value="id"
                placeholder="Select user to add..."
                class="flex-1"
              />
              <Button label="Add" icon="pi pi-plus" :disabled="!selectedUserId" :loading="saving" @click="addUserToRole" />
            </div>
            <DataTable :value="roleUsers" size="small" striped-rows data-key="id">
              <template #empty><p class="text-center text-gray-500 py-4">No users assigned to this role.</p></template>
              <Column field="username" header="Username" />
              <Column field="firstName" header="First Name" />
              <Column field="lastName" header="Last Name" />
              <Column style="width: 80px">
                <template #body="{ data }">
                  <Button icon="pi pi-times" size="small" text severity="danger" @click="removeUserFromRole(data)" v-tooltip="'Remove'" />
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>
      </Tabs>
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
import Checkbox from 'primevue/checkbox';
import Select from 'primevue/select';
import Badge from 'primevue/badge';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';

import {
  GetRoles, GetRoleById, CreateRole, DeleteRole,
  GetAllPermissions, GetUsers,
  AssignPermissionToRole, RemovePermissionFromRole,
  AssignUserToRole, RemoveUserFromRole,
} from '../api/api';

const confirm = useConfirm();
const toast = useToast();

// ── List ──────────────────────────────────────────────────────────────────────
const roles = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);

// ── Create dialog ─────────────────────────────────────────────────────────────
const createDialogVisible = ref(false);
const createName = ref('');
const createError = ref('');

// ── Edit dialog ───────────────────────────────────────────────────────────────
const editDialogVisible = ref(false);
const editingRole = ref<any>(null);
const editTab = ref('permissions');

// Permissions tab
const allPermissions = ref<any[]>([]);
const assignedPermissions = ref<any[]>([]); // full assignment objects { id, name, ... }
const assignedPermNames = ref<string[]>([]);

// Users tab
const roleUsers = ref<any[]>([]); // assigned users with assignmentId
const allUsers = ref<any[]>([]);
const availableUsers = ref<any[]>([]);
const selectedUserId = ref<string | null>(null);

async function loadRoles() {
  loading.value = true;
  try {
    roles.value = (await GetRoles()) ?? [];
  } finally {
    loading.value = false;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────
function openCreate() {
  createName.value = '';
  createError.value = '';
  createDialogVisible.value = true;
}

async function submitCreate() {
  createError.value = '';
  if (!createName.value.trim()) {
    createError.value = 'Role name is required.';
    return;
  }
  saving.value = true;
  try {
    const created = await CreateRole({ name: createName.value.trim() });
    if (!created) throw new Error();
    roles.value.unshift({ ...created, permissions: [], users: [] });
    createDialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Created', detail: 'Role created', life: 3000 });
  } catch {
    createError.value = 'Failed to create role.';
  } finally {
    saving.value = false;
  }
}

// ── Edit ──────────────────────────────────────────────────────────────────────
async function openEdit(role: any) {
  editingRole.value = role;
  editTab.value = 'permissions';
  assignedPermissions.value = [];
  assignedPermNames.value = [];
  roleUsers.value = [];
  selectedUserId.value = null;
  editDialogVisible.value = true;

  // Load all permissions and full role detail in parallel
  const [perms, users, detail] = await Promise.all([
    GetAllPermissions(),
    GetUsers(),
    GetRoleById(role.id),
  ]);

  allPermissions.value = perms ?? [];
  allUsers.value = users ?? [];

  if (detail) {
    assignedPermissions.value = detail.permissions ?? [];
    assignedPermNames.value = assignedPermissions.value.map((p: any) => p.name);
    roleUsers.value = detail.users ?? [];
  }

  // Available = all users not already assigned
  const assignedUserIds = new Set(roleUsers.value.map((u: any) => u.id));
  availableUsers.value = allUsers.value.filter((u: any) => !assignedUserIds.has(u.id));
}

async function onPermissionToggle(perm: any) {
  const isAssigned = assignedPermNames.value.includes(perm.name);

  if (isAssigned) {
    // Assign it
    const result = await AssignPermissionToRole(editingRole.value.id, { name: perm.name });
    if (result) {
      assignedPermissions.value.push(result);
      // Update the role list badge count
      const idx = roles.value.findIndex((r) => r.id === editingRole.value.id);
      if (idx !== -1) roles.value[idx].permissions = assignedPermissions.value;
    }
  } else {
    // Remove it
    const assignment = assignedPermissions.value.find((p: any) => p.name === perm.name);
    if (assignment) {
      const ok = await RemovePermissionFromRole(editingRole.value.id, assignment.id);
      if (ok) {
        assignedPermissions.value = assignedPermissions.value.filter((p: any) => p.name !== perm.name);
        const idx = roles.value.findIndex((r) => r.id === editingRole.value.id);
        if (idx !== -1) roles.value[idx].permissions = assignedPermissions.value;
      }
    }
  }
}

async function addUserToRole() {
  if (!selectedUserId.value) return;
  saving.value = true;
  try {
    const result = await AssignUserToRole(editingRole.value.id, { userId: selectedUserId.value });
    if (result) {
      const user = allUsers.value.find((u: any) => u.id === selectedUserId.value);
      if (user) {
        roleUsers.value.push({ ...user, assignmentId: result.id });
        availableUsers.value = availableUsers.value.filter((u: any) => u.id !== selectedUserId.value);
        const idx = roles.value.findIndex((r) => r.id === editingRole.value.id);
        if (idx !== -1) roles.value[idx].users = roleUsers.value;
      }
      selectedUserId.value = null;
      toast.add({ severity: 'success', summary: 'Added', detail: 'User assigned to role', life: 3000 });
    }
  } finally {
    saving.value = false;
  }
}

async function removeUserFromRole(user: any) {
  const ok = await RemoveUserFromRole(editingRole.value.id, user.assignmentId ?? user.id);
  if (ok) {
    roleUsers.value = roleUsers.value.filter((u: any) => u.id !== user.id);
    availableUsers.value.push(user);
    const idx = roles.value.findIndex((r) => r.id === editingRole.value.id);
    if (idx !== -1) roles.value[idx].users = roleUsers.value;
    toast.add({ severity: 'success', summary: 'Removed', detail: 'User removed from role', life: 3000 });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function confirmDelete(role: any) {
  confirm.require({
    message: `Delete role "${role.name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      const ok = await DeleteRole(role.id);
      if (ok) {
        roles.value = roles.value.filter((r) => r.id !== role.id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Role deleted', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
      }
    },
  });
}

onMounted(() => loadRoles());
</script>

<style scoped>
#roles-page {
  min-height: 100vh;
}

.roles-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
