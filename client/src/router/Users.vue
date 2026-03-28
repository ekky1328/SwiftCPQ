<template>
  <div id="users-page">
    <Toolbar class="users-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">Users</h1>
      </template>
      <template #end>
        <Button label="New User" icon="pi pi-plus" size="small" severity="contrast" @click="openCreate" />
      </template>
    </Toolbar>

    <div class="m-2">
      <DataTable :value="users" :loading="loading" size="small" striped-rows data-key="id">
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No users found.</p>
          </div>
        </template>
        <Column field="username" header="Username" />
        <Column field="firstName" header="First Name" />
        <Column field="lastName" header="Last Name" />
        <Column field="title" header="Title" />
        <Column header="Super Admin" style="width: 120px">
          <template #body="{ data }">
            <Tag v-if="data.isSuperAdmin" value="Super Admin" severity="warn" />
          </template>
        </Column>
        <Column header="Status" style="width: 100px">
          <template #body="{ data }">
            <Tag :value="data.isActive ? 'Active' : 'Inactive'" :severity="data.isActive ? 'success' : 'secondary'" />
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

    <!-- Create / Edit Dialog -->
    <Dialog v-model:visible="dialogVisible" :header="editingUser ? 'Edit User' : 'New User'" modal style="width: 520px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Username <span class="text-red-500">*</span></label>
            <InputText v-model="form.username" :disabled="!!editingUser" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Password {{ editingUser ? '(leave blank to keep)' : '' }} <span v-if="!editingUser" class="text-red-500">*</span></label>
            <InputText v-model="form.password" type="password" :placeholder="editingUser ? 'Leave blank to keep existing' : ''" fluid />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">First Name</label>
            <InputText v-model="form.firstName" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Last Name</label>
            <InputText v-model="form.lastName" fluid />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Title</label>
          <InputText v-model="form.title" placeholder="e.g. Account Manager" fluid />
        </div>
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="form.isSuperAdmin" inputId="superAdmin" />
          <label for="superAdmin" class="text-sm font-medium cursor-pointer">Super Admin</label>
        </div>
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="form.isActive" inputId="isActive" />
          <label for="isActive" class="text-sm font-medium cursor-pointer">Active</label>
        </div>
        <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="dialogVisible = false" />
        <Button :label="editingUser ? 'Save Changes' : 'Create'" :loading="saving" @click="submitForm" />
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
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';

import { GetUsers, CreateUser, UpdateUser, DeleteUser } from '../api/api';

const confirm = useConfirm();
const toast = useToast();

const users = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingUser = ref<any>(null);
const formError = ref('');

const emptyForm = () => ({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  title: '',
  isSuperAdmin: false,
  isActive: true,
});

const form = ref(emptyForm());

async function loadUsers() {
  loading.value = true;
  try {
    users.value = (await GetUsers()) ?? [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingUser.value = null;
  form.value = emptyForm();
  formError.value = '';
  dialogVisible.value = true;
}

function openEdit(user: any) {
  editingUser.value = user;
  form.value = {
    username: user.username,
    password: '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    title: user.title ?? '',
    isSuperAdmin: user.isSuperAdmin ?? false,
    isActive: user.isActive ?? true,
  };
  formError.value = '';
  dialogVisible.value = true;
}

async function submitForm() {
  formError.value = '';

  if (!editingUser.value && !form.value.username.trim()) {
    formError.value = 'Username is required.';
    return;
  }
  if (!editingUser.value && !form.value.password) {
    formError.value = 'Password is required for new users.';
    return;
  }

  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      title: form.value.title,
      isSuperAdmin: form.value.isSuperAdmin,
      isActive: form.value.isActive,
    };
    if (form.value.password) payload.password = form.value.password;

    if (editingUser.value) {
      const updated = await UpdateUser(editingUser.value.id, payload);
      if (!updated) throw new Error();
      const idx = users.value.findIndex((u) => u.id === editingUser.value.id);
      if (idx !== -1) users.value[idx] = updated;
      toast.add({ severity: 'success', summary: 'Saved', detail: 'User updated', life: 3000 });
    } else {
      const created = await CreateUser({ ...payload, username: form.value.username, password: form.value.password });
      if (!created) throw new Error();
      users.value.unshift(created);
      toast.add({ severity: 'success', summary: 'Created', detail: 'User created', life: 3000 });
    }
    dialogVisible.value = false;
  } catch {
    formError.value = 'Something went wrong. Please try again.';
  } finally {
    saving.value = false;
  }
}

function confirmDelete(user: any) {
  confirm.require({
    message: `Delete user "${user.username}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      const ok = await DeleteUser(user.id);
      if (ok) {
        users.value = users.value.filter((u) => u.id !== user.id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'User removed', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
      }
    },
  });
}

onMounted(() => loadUsers());
</script>

<style scoped>
#users-page {
  min-height: 100vh;
}

.users-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
