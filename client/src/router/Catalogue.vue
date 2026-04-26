<template>
  <div id="catalogue-page">
    <Toolbar class="catalogue-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">Product Catalogue</h1>
      </template>
      <template #end>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="searchQuery" placeholder="Search..." size="small" @input="onSearch" />
        </IconField>
        <Button label="New Item" icon="pi pi-plus" size="small" severity="contrast" class="ml-2" @click="openCreate" />
      </template>
    </Toolbar>

    <div class="m-2">
      <DataTable
        :value="items"
        :loading="loading"
        size="small"
        striped-rows
        data-key="id"
      >
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No catalogue items found.</p>
            <Button label="Create your first item" size="small" severity="contrast" class="mt-3" @click="openCreate" />
          </div>
        </template>

        <Column field="sku" header="SKU" style="width: 120px" />
        <Column field="title" header="Title" />
        <Column field="type" header="Type" style="width: 100px">
          <template #body="{ data }">
            <Tag :value="data.type" :severity="data.type === 'PRODUCT' ? 'info' : 'secondary'" />
          </template>
        </Column>
        <Column field="cost" header="Cost" style="width: 120px">
          <template #body="{ data }">{{ formatCurrency(data.cost, 'AUD', 'en-AU') }}</template>
        </Column>
        <Column field="price" header="Price" style="width: 120px">
          <template #body="{ data }">{{ formatCurrency(data.price, 'AUD', 'en-AU') }}</template>
        </Column>
        <Column header="Margin" style="width: 100px">
          <template #body="{ data }">{{ calcMargin(data.cost, data.price) }}%</template>
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
    <Dialog v-model:visible="dialogVisible" :header="editingItem ? 'Edit Item' : 'New Catalogue Item'" modal style="width: 520px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Title <span class="text-red-500">*</span></label>
            <InputText v-model="form.title" placeholder="e.g. Managed Firewall" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">SKU</label>
            <InputText v-model="form.sku" placeholder="e.g. FW-001" fluid />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Description</label>
          <Textarea v-model="form.description" placeholder="Optional description..." :rows="3" fluid auto-resize />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Type</label>
            <Select
              v-model="form.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              fluid
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Cost ($)</label>
            <InputNumber v-model="form.cost" :min-fraction-digits="2" :max-fraction-digits="2" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Price ($)</label>
            <InputNumber v-model="form.price" :min-fraction-digits="2" :max-fraction-digits="2" fluid />
          </div>
        </div>

        <div v-if="form.cost !== null && form.price !== null" class="text-sm text-gray-500">
          Margin: <strong>{{ calcMargin(form.cost, form.price) }}%</strong>
        </div>

        <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" @click="dialogVisible = false" />
        <Button :label="editingItem ? 'Save Changes' : 'Create'" :loading="saving" @click="submitForm" />
      </template>
    </Dialog>

    <!-- Delete confirmation -->
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
import InputNumber from 'primevue/inputnumber';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';

import {
  GetCatalogueItems,
  CreateCatalogueItem,
  UpdateCatalogueItem,
  DeleteCatalogueItem,
} from '../api/api';
import { formatCurrency } from '../utils/helpers';

const confirm = useConfirm();
const toast = useToast();

const items = ref<CatalogueItem[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const editingItem = ref<CatalogueItem | null>(null);
const formError = ref('');

const typeOptions = [
  { label: 'Product', value: 'PRODUCT' },
  { label: 'Bundle', value: 'BUNDLE' },
];

const emptyForm = () => ({
  title: '',
  sku: '',
  description: '',
  type: 'PRODUCT' as 'PRODUCT' | 'BUNDLE',
  cost: 0,
  price: 0,
});

const form = ref(emptyForm());

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function calcMargin(cost: number, price: number): string {
  if (!price || price === 0) return '0.00';
  return (((price - cost) / price) * 100).toFixed(2);
}

async function loadItems(search?: string) {
  loading.value = true;
  try {
    const data = await GetCatalogueItems(search);
    items.value = data ?? [];
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadItems(searchQuery.value), 300);
}

function openCreate() {
  editingItem.value = null;
  form.value = emptyForm();
  formError.value = '';
  dialogVisible.value = true;
}

function openEdit(item: CatalogueItem) {
  editingItem.value = item;
  form.value = {
    title: item.title,
    sku: item.sku,
    description: item.description,
    type: item.type,
    cost: item.cost,
    price: item.price,
  };
  formError.value = '';
  dialogVisible.value = true;
}

async function submitForm() {
  formError.value = '';
  if (!form.value.title.trim()) {
    formError.value = 'Title is required.';
    return;
  }

  saving.value = true;
  try {
    if (editingItem.value) {
      const updated = await UpdateCatalogueItem(editingItem.value.id, form.value);
      if (!updated) throw new Error('Update failed');
      const idx = items.value.findIndex((i) => i.id === editingItem.value!.id);
      if (idx !== -1) items.value[idx] = updated;
      toast.add({ severity: 'success', summary: 'Saved', detail: 'Item updated', life: 3000 });
    } else {
      const created = await CreateCatalogueItem(form.value);
      if (!created) throw new Error('Create failed');
      items.value.unshift(created);
      toast.add({ severity: 'success', summary: 'Created', detail: 'Item added to catalogue', life: 3000 });
    }
    dialogVisible.value = false;
  } catch {
    formError.value = 'Something went wrong. Please try again.';
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item: CatalogueItem) {
  confirm.require({
    message: `Delete "${item.title}" from the catalogue?`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      const ok = await DeleteCatalogueItem(item.id);
      if (ok) {
        items.value = items.value.filter((i) => i.id !== item.id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Item removed', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete item', life: 3000 });
      }
    },
  });
}

onMounted(() => loadItems());
</script>

<style scoped>
#catalogue-page {
  min-height: 100vh;
}

.catalogue-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
