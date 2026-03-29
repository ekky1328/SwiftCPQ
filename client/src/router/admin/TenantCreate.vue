<template>
  <div id="tenant-create-page">
    <Toolbar class="tenant-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">New Tenant</h1>
      </template>
      <template #end>
        <Button label="Cancel" severity="secondary" size="small" @click="router.push('/admin/tenants')" />
      </template>
    </Toolbar>

    <div class="m-2 max-w-3xl">
      <Card>
        <template #title>Tenant Details</template>
        <template #content>
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Name <span class="text-red-500">*</span></label>
                <InputText v-model="form.name" placeholder="e.g. Acme Corp" fluid @blur="autoSlug" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Subdomain <span class="text-red-500">*</span></label>
                <InputText v-model="form.subdomain" placeholder="e.g. acme-corp" fluid />
                <small class="text-gray-500">Lowercase letters, numbers, and hyphens only</small>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="mt-4">
        <template #title>Initial Admin User</template>
        <template #subtitle>This user will be the tenant administrator. They will be required to change their password on first login.</template>
        <template #content>
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">First Name <span class="text-red-500">*</span></label>
                <InputText v-model="form.adminFirstName" fluid />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Last Name <span class="text-red-500">*</span></label>
                <InputText v-model="form.adminLastName" fluid />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Username <span class="text-red-500">*</span></label>
                <InputText v-model="form.adminUsername" placeholder="e.g. admin@acme.com" fluid />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Temporary Password <span class="text-red-500">*</span></label>
                <InputText v-model="form.adminPassword" type="password" fluid />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <div class="mt-4 flex gap-3">
        <Message v-if="errorMessage" severity="error" :closable="false" class="flex-1">{{ errorMessage }}</Message>
      </div>

      <div class="mt-4 flex justify-end">
        <Button label="Create Tenant" icon="pi pi-check" :loading="saving" @click="handleCreate" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';

import { AdminCreateTenant } from '../../api/api';

const router = useRouter();
const toast = useToast();

const saving = ref(false);
const errorMessage = ref('');

const form = ref({
  name: '',
  subdomain: '',
  adminFirstName: '',
  adminLastName: '',
  adminUsername: '',
  adminPassword: '',
});

function autoSlug() {
  if (!form.value.subdomain && form.value.name) {
    form.value.subdomain = form.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

async function handleCreate() {
  errorMessage.value = '';

  if (!form.value.name.trim()) { errorMessage.value = 'Tenant name is required'; return; }
  if (!form.value.subdomain.trim()) { errorMessage.value = 'Subdomain is required'; return; }
  if (!form.value.adminFirstName.trim()) { errorMessage.value = 'Admin first name is required'; return; }
  if (!form.value.adminLastName.trim()) { errorMessage.value = 'Admin last name is required'; return; }
  if (!form.value.adminUsername.trim()) { errorMessage.value = 'Admin username is required'; return; }
  if (!form.value.adminPassword) { errorMessage.value = 'Temporary password is required'; return; }

  saving.value = true;
  try {
    const result = await AdminCreateTenant({
      name: form.value.name,
      subdomain: form.value.subdomain,
      adminUser: {
        firstName: form.value.adminFirstName,
        lastName: form.value.adminLastName,
        username: form.value.adminUsername,
        password: form.value.adminPassword,
      },
    });

    if (!result) {
      errorMessage.value = 'Failed to create tenant';
      return;
    }

    if (result.error) {
      errorMessage.value = result.message;
      return;
    }

    toast.add({
      severity: 'success',
      summary: 'Tenant Created',
      detail: `${result.name} has been provisioned. The admin user must change their password on first login.`,
      life: 5000,
    });

    router.push(`/admin/tenants/${result.id}`);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
#tenant-create-page {
  min-height: 100vh;
}

.tenant-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
