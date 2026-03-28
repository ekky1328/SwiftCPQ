<template>
  <div id="suppliers-page">
    <Toolbar class="suppliers-toolbar m-2 mt-0 !border-none">
      <template #start>
        <h1 class="m-0 text-3xl">Suppliers</h1>
      </template>
      <template #end>
        <Button label="New Supplier" icon="pi pi-plus" size="small" severity="contrast" @click="openCreate" />
      </template>
    </Toolbar>

    <div class="m-2">
      <DataTable :value="suppliers" :loading="loading" size="small" striped-rows data-key="id">
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No suppliers yet.</p>
            <Button label="Add your first supplier" size="small" severity="contrast" class="mt-3" @click="openCreate" />
          </div>
        </template>
        <Column field="name" header="Name" />
        <Column field="code" header="Code" style="width: 120px" />
        <Column header="Status" style="width: 100px">
          <template #body="{ data }">
            <Tag :value="data.isActive ? 'Active' : 'Inactive'" :severity="data.isActive ? 'success' : 'secondary'" />
          </template>
        </Column>
        <Column style="width: 160px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button label="Manage" icon="pi pi-cog" size="small" text @click="openManage(data)" />
              <Button icon="pi pi-trash" size="small" text severity="danger" @click="confirmDelete(data)" v-tooltip="'Delete'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create Dialog -->
    <Dialog v-model:visible="createDialogVisible" header="New Supplier" modal style="width: 480px">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Name <span class="text-red-500">*</span></label>
          <InputText v-model="createForm.name" placeholder="e.g. Acme Wholesale" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Code</label>
          <InputText v-model="createForm.code" placeholder="e.g. ACMEWHL" fluid />
        </div>
        <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="createDialogVisible = false" />
        <Button label="Create" :loading="saving" @click="submitCreate" />
      </template>
    </Dialog>

    <!-- Manage Dialog (full-width) -->
    <Dialog
      v-model:visible="manageDialogVisible"
      :header="managingSupplier ? `Manage: ${managingSupplier.name}` : ''"
      modal
      style="width: 90vw; max-width: 1100px"
    >
      <Tabs v-model:value="manageTab">
        <TabList>
          <Tab value="details">Details</Tab>
          <Tab value="templates">Import Templates</Tab>
          <Tab value="ingestion">Ingestion</Tab>
        </TabList>

        <!-- Details Tab -->
        <TabPanel value="details">
          <div class="flex flex-col gap-4 pt-3 max-w-md">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Name</label>
              <InputText v-model="editForm.name" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Code</label>
              <InputText v-model="editForm.code" fluid />
            </div>
            <div class="flex items-center gap-3">
              <ToggleSwitch v-model="editForm.isActive" inputId="supplierActive" />
              <label for="supplierActive" class="text-sm font-medium cursor-pointer">Active</label>
            </div>
            <div class="flex justify-end">
              <Button label="Save" :loading="saving" @click="submitEdit" />
            </div>
          </div>
        </TabPanel>

        <!-- Import Templates Tab -->
        <TabPanel value="templates">
          <div class="pt-3">
            <div class="flex justify-end mb-3">
              <Button label="New Template" icon="pi pi-plus" size="small" severity="contrast" @click="openCreateTemplate" />
            </div>
            <DataTable :value="templates" size="small" striped-rows data-key="id">
              <template #empty><p class="text-center text-gray-500 py-4">No import templates.</p></template>
              <Column field="name" header="Name" />
              <Column field="delimiter" header="Delimiter" style="width: 120px">
                <template #body="{ data }">{{ delimiterLabel(data.delimiter) }}</template>
              </Column>
              <Column header="Has Header" style="width: 120px">
                <template #body="{ data }">
                  <Tag :value="data.hasHeaderRow ? 'Yes' : 'No'" :severity="data.hasHeaderRow ? 'success' : 'secondary'" />
                </template>
              </Column>
              <Column style="width: 100px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button icon="pi pi-pencil" size="small" text @click="openEditTemplate(data)" />
                    <Button icon="pi pi-trash" size="small" text severity="danger" @click="deleteTemplate(data)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>

        <!-- Ingestion Tab -->
        <TabPanel value="ingestion">
          <div class="pt-3">
            <div class="flex items-end gap-3 mb-4 p-3 bg-gray-50 rounded border">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm font-medium">CSV File</label>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".csv"
                  @change="onFileChange"
                  class="text-sm"
                />
              </div>
              <Button
                label="Upload &amp; Ingest"
                icon="pi pi-upload"
                :loading="ingesting"
                :disabled="!selectedFile"
                @click="triggerIngestion"
              />
            </div>

            <div v-if="lastJobId" class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              Last job queued: <code class="font-mono text-xs bg-white px-1 py-0.5 rounded">{{ lastJobId }}</code>
            </div>

            <div class="flex justify-between items-center mb-2">
              <h3 class="text-base font-semibold">Recent Jobs</h3>
              <Button label="Refresh All" icon="pi pi-refresh" size="small" text @click="refreshAllJobs" />
            </div>

            <DataTable :value="jobs" size="small" striped-rows data-key="jobId">
              <template #empty><p class="text-center text-gray-500 py-4">No jobs yet.</p></template>
              <Column header="Job ID" style="width: 200px">
                <template #body="{ data }">
                  <code class="font-mono text-xs">{{ data.jobId.slice(0, 8) }}...</code>
                </template>
              </Column>
              <Column header="Status" style="width: 130px">
                <template #body="{ data }">
                  <Tag :value="data.status" :severity="jobSeverity(data.status)" />
                </template>
              </Column>
              <Column header="Queued" style="width: 160px">
                <template #body="{ data }">{{ formatDate(data.createdOnDate) }}</template>
              </Column>
              <Column header="Completed" style="width: 160px">
                <template #body="{ data }">{{ data.completedAt ? formatDate(data.completedAt) : '—' }}</template>
              </Column>
              <Column style="width: 80px">
                <template #body="{ data }">
                  <Button icon="pi pi-refresh" size="small" text @click="refreshJob(data)" v-tooltip="'Refresh status'" />
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>
      </Tabs>
    </Dialog>

    <!-- Template Create/Edit Dialog -->
    <Dialog
      v-model:visible="templateDialogVisible"
      :header="editingTemplate ? 'Edit Import Template' : 'New Import Template'"
      modal
      style="width: 560px"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Template Name <span class="text-red-500">*</span></label>
          <InputText v-model="templateForm.name" fluid />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Delimiter</label>
            <Select
              v-model="templateForm.delimiter"
              :options="delimiterOptions"
              option-label="label"
              option-value="value"
              fluid
            />
          </div>
          <div class="flex flex-col gap-1 justify-end">
            <div class="flex items-center gap-2 mb-1">
              <ToggleSwitch v-model="templateForm.hasHeaderRow" inputId="hasHeader" />
              <label for="hasHeader" class="text-sm font-medium cursor-pointer">Has Header Row</label>
            </div>
          </div>
        </div>

        <div class="border rounded p-3 bg-gray-50">
          <p class="text-sm font-semibold mb-2">Column Mapping <span class="font-normal text-gray-500">(enter CSV column header names)</span></p>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">SKU <span class="text-red-500">*</span></label>
              <InputText v-model="templateForm.columnMapping.sku" placeholder="sku" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Supplier SKU</label>
              <InputText v-model="templateForm.columnMapping.supplier_sku" placeholder="supplier_sku" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Stock Level</label>
              <InputText v-model="templateForm.columnMapping.stock_level" placeholder="stock_level" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Cost Price</label>
              <InputText v-model="templateForm.columnMapping.cost_price" placeholder="cost_price" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Title</label>
              <InputText v-model="templateForm.columnMapping.title" placeholder="title" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Description</label>
              <InputText v-model="templateForm.columnMapping.description" placeholder="description" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Price</label>
              <InputText v-model="templateForm.columnMapping.price" placeholder="price" fluid />
            </div>
          </div>
        </div>

        <Message v-if="templateError" severity="error" :closable="false">{{ templateError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="templateDialogVisible = false" />
        <Button :label="editingTemplate ? 'Save' : 'Create'" :loading="saving" @click="submitTemplate" />
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
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';

import {
  GetSuppliers, CreateSupplier, UpdateSupplier, DeleteSupplier,
  GetImportTemplates, CreateImportTemplate, UpdateImportTemplate, DeleteImportTemplate,
  TriggerIngestion, GetIngestionJobStatus,
} from '../api/api';

const confirm = useConfirm();
const toast = useToast();

// ── Suppliers list ────────────────────────────────────────────────────────────
const suppliers = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);

// ── Create dialog ─────────────────────────────────────────────────────────────
const createDialogVisible = ref(false);
const createError = ref('');
const createForm = ref({ name: '', code: '' });

// ── Manage dialog ─────────────────────────────────────────────────────────────
const manageDialogVisible = ref(false);
const managingSupplier = ref<any>(null);
const manageTab = ref('details');
const editForm = ref({ name: '', code: '', isActive: true });

// ── Templates ─────────────────────────────────────────────────────────────────
const templates = ref<any[]>([]);
const templateDialogVisible = ref(false);
const editingTemplate = ref<any>(null);
const templateError = ref('');

const emptyColumnMapping = () => ({
  sku: 'sku',
  supplier_sku: '',
  stock_level: 'stock_level',
  cost_price: 'cost_price',
  title: '',
  description: '',
  price: '',
});

const templateForm = ref({
  name: '',
  delimiter: ',',
  hasHeaderRow: true,
  columnMapping: emptyColumnMapping(),
});

const delimiterOptions = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Pipe (|)', value: '|' },
  { label: 'Tab (\\t)', value: '\t' },
];

function delimiterLabel(d: string) {
  return delimiterOptions.find((o) => o.value === d)?.label ?? d;
}

// ── Ingestion ─────────────────────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const ingesting = ref(false);
const lastJobId = ref('');
const jobs = ref<any[]>([]);

function jobSeverity(status: string) {
  const map: Record<string, string> = {
    PENDING: 'warn',
    PROCESSING: 'info',
    COMPLETED: 'success',
    FAILED: 'danger',
  };
  return map[status] ?? 'secondary';
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-AU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadSuppliers() {
  loading.value = true;
  try {
    suppliers.value = (await GetSuppliers()) ?? [];
  } finally {
    loading.value = false;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────
function openCreate() {
  createForm.value = { name: '', code: '' };
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
    const created = await CreateSupplier(createForm.value);
    if (!created) throw new Error();
    suppliers.value.unshift(created);
    createDialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Created', detail: 'Supplier added', life: 3000 });
  } catch {
    createError.value = 'Failed to create supplier.';
  } finally {
    saving.value = false;
  }
}

// ── Manage ────────────────────────────────────────────────────────────────────
async function openManage(supplier: any) {
  managingSupplier.value = supplier;
  editForm.value = { name: supplier.name, code: supplier.code ?? '', isActive: supplier.isActive };
  manageTab.value = 'details';
  templates.value = [];
  jobs.value = [];
  lastJobId.value = '';
  selectedFile.value = null;
  manageDialogVisible.value = true;

  // Load templates
  const tpls = await GetImportTemplates(supplier.id);
  templates.value = tpls ?? [];
}

async function submitEdit() {
  saving.value = true;
  try {
    const updated = await UpdateSupplier(managingSupplier.value.id, editForm.value);
    if (!updated) throw new Error();
    const idx = suppliers.value.findIndex((s) => s.id === managingSupplier.value.id);
    if (idx !== -1) suppliers.value[idx] = updated;
    managingSupplier.value = updated;
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Supplier updated', life: 3000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save', life: 3000 });
  } finally {
    saving.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function confirmDelete(supplier: any) {
  confirm.require({
    message: `Delete supplier "${supplier.name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      const ok = await DeleteSupplier(supplier.id);
      if (ok) {
        suppliers.value = suppliers.value.filter((s) => s.id !== supplier.id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Supplier deleted', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete', life: 3000 });
      }
    },
  });
}

// ── Templates ─────────────────────────────────────────────────────────────────
function openCreateTemplate() {
  editingTemplate.value = null;
  templateError.value = '';
  templateForm.value = {
    name: '',
    delimiter: ',',
    hasHeaderRow: true,
    columnMapping: emptyColumnMapping(),
  };
  templateDialogVisible.value = true;
}

function openEditTemplate(tpl: any) {
  editingTemplate.value = tpl;
  templateError.value = '';
  const cm = tpl.columnMapping ?? {};
  templateForm.value = {
    name: tpl.name,
    delimiter: tpl.delimiter ?? ',',
    hasHeaderRow: tpl.hasHeaderRow ?? true,
    columnMapping: {
      sku: cm.sku ?? 'sku',
      supplier_sku: cm.supplier_sku ?? '',
      stock_level: cm.stock_level ?? 'stock_level',
      cost_price: cm.cost_price ?? 'cost_price',
      title: cm.title ?? '',
      description: cm.description ?? '',
      price: cm.price ?? '',
    },
  };
  templateDialogVisible.value = true;
}

async function submitTemplate() {
  templateError.value = '';
  if (!templateForm.value.name.trim()) {
    templateError.value = 'Template name is required.';
    return;
  }
  if (!templateForm.value.columnMapping.sku.trim()) {
    templateError.value = 'SKU column mapping is required.';
    return;
  }

  // Strip empty optional fields from mapping
  const cm: Record<string, string> = { sku: templateForm.value.columnMapping.sku };
  if (templateForm.value.columnMapping.supplier_sku?.trim()) cm.supplier_sku = templateForm.value.columnMapping.supplier_sku;
  if (templateForm.value.columnMapping.stock_level?.trim()) cm.stock_level = templateForm.value.columnMapping.stock_level;
  if (templateForm.value.columnMapping.cost_price?.trim()) cm.cost_price = templateForm.value.columnMapping.cost_price;
  if (templateForm.value.columnMapping.title?.trim()) cm.title = templateForm.value.columnMapping.title;
  if (templateForm.value.columnMapping.description?.trim()) cm.description = templateForm.value.columnMapping.description;
  if (templateForm.value.columnMapping.price?.trim()) cm.price = templateForm.value.columnMapping.price;

  saving.value = true;
  try {
    const payload = {
      supplierId: managingSupplier.value.id,
      name: templateForm.value.name.trim(),
      delimiter: templateForm.value.delimiter,
      hasHeaderRow: templateForm.value.hasHeaderRow,
      columnMapping: cm,
    };

    if (editingTemplate.value) {
      const updated = await UpdateImportTemplate(editingTemplate.value.id, payload);
      if (updated) {
        const idx = templates.value.findIndex((t) => t.id === editingTemplate.value.id);
        if (idx !== -1) templates.value[idx] = updated;
        toast.add({ severity: 'success', summary: 'Saved', detail: 'Template updated', life: 3000 });
      }
    } else {
      const created = await CreateImportTemplate(payload);
      if (created) {
        templates.value.unshift(created);
        toast.add({ severity: 'success', summary: 'Created', detail: 'Template created', life: 3000 });
      }
    }
    templateDialogVisible.value = false;
  } catch {
    templateError.value = 'Failed to save template.';
  } finally {
    saving.value = false;
  }
}

async function deleteTemplate(tpl: any) {
  const ok = await DeleteImportTemplate(tpl.id);
  if (ok) {
    templates.value = templates.value.filter((t) => t.id !== tpl.id);
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Template deleted', life: 3000 });
  }
}

// ── Ingestion ─────────────────────────────────────────────────────────────────
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

async function triggerIngestion() {
  if (!selectedFile.value || !managingSupplier.value) return;
  ingesting.value = true;
  try {
    const buffer = await selectedFile.value.arrayBuffer();
    const result = await TriggerIngestion(managingSupplier.value.id, buffer);
    if (result) {
      lastJobId.value = result.jobId;
      jobs.value.unshift(result);
      toast.add({ severity: 'success', summary: 'Queued', detail: `Job ${result.jobId.slice(0, 8)} queued`, life: 4000 });
      // Reset file input
      selectedFile.value = null;
      if (fileInputRef.value) fileInputRef.value.value = '';
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to queue ingestion job', life: 4000 });
    }
  } finally {
    ingesting.value = false;
  }
}

async function refreshJob(job: any) {
  const updated = await GetIngestionJobStatus(job.jobId);
  if (updated) {
    const idx = jobs.value.findIndex((j) => j.jobId === job.jobId);
    if (idx !== -1) jobs.value[idx] = updated;
  }
}

async function refreshAllJobs() {
  await Promise.all(jobs.value.map((j) => refreshJob(j)));
}

onMounted(() => loadSuppliers());
</script>

<style scoped>
#suppliers-page {
  min-height: 100vh;
}

.suppliers-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ebeef0;
}
</style>
