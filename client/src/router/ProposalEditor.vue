<template>
  <div id="proposal-editor" v-if="proposalStore.data !== null">

    <!-- Version History Dialog -->
    <Dialog
      v-model:visible="showVersionHistory"
      :header="previewVersion ? `v${previewVersion.version} — ${new Date(previewVersion.createdOnDate).toLocaleString()}` : 'Version History'"
      :style="{ width: '620px' }"
      modal
      @hide="previewVersion = null"
    >
      <!-- List view -->
      <template v-if="!previewVersion">
        <p v-if="versions.length === 0" class="text-gray-500 text-sm">No saved versions yet. Versions are created each time you save.</p>
        <DataTable v-else :value="versions" size="small">
          <Column field="version" header="Version" style="width: 80px">
            <template #body="{ data }">
              <span class="font-mono">v{{ data.version }}</span>
            </template>
          </Column>
          <Column field="createdOnDate" header="Saved At">
            <template #body="{ data }">
              {{ new Date(data.createdOnDate).toLocaleString() }}
            </template>
          </Column>
          <Column header="" style="width: 150px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button label="View" size="small" severity="secondary" :loading="previewLoading === data.id" @click="loadPreview(data)" />
                <Button label="Restore" size="small" severity="warn" @click="confirmRevert(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>

      <!-- Preview view -->
      <template v-else>
        <div class="flex items-center gap-2 mb-4">
          <Button icon="pi pi-arrow-left" label="Back to list" text size="small" @click="previewVersion = null" />
        </div>

        <div class="flex flex-col gap-3 mb-4 p-3 bg-gray-50 rounded border">
          <div>
            <p class="text-xs text-gray-500 mb-1">Title</p>
            <p class="font-medium">{{ previewVersion.title || '(untitled)' }}</p>
          </div>
          <div v-if="previewVersion.description">
            <p class="text-xs text-gray-500 mb-1">Description</p>
            <p class="text-sm">{{ previewVersion.description }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Status</p>
            <Tag :value="previewVersion.status" />
          </div>
        </div>

        <div class="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
          <div v-for="section in previewVersion.sections" :key="section.id" class="border rounded p-2">
            <p class="text-sm font-medium">{{ section.title }} <span class="text-xs text-gray-400 font-normal ml-1">{{ section.type }}</span></p>
            <ul v-if="section.items?.length" class="mt-1 ml-2 space-y-0.5">
              <li v-for="item in section.items" :key="item.id" class="flex justify-between text-xs text-gray-600">
                <span>{{ item.title || '(unnamed)' }}</span>
                <span class="tabular-nums">{{ item.qty }}× {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price) }}</span>
              </li>
            </ul>
            <p v-else-if="section.type === 'PRODUCTS'" class="text-xs text-gray-400 mt-1 ml-2">No items</p>
          </div>
        </div>

        <div class="flex justify-end">
          <Button label="Restore this version" icon="pi pi-history" severity="warn" @click="confirmRevert(previewVersion)" />
        </div>
      </template>
    </Dialog>

    <ConfirmDialog />

    <Toolbar class="proposal-toolbar m-2 mt-0 !border-none">
      <template #start> 
        <h1 class="m-0 text-3xl">{{ concatProposalIdentifier(proposalStore.data) }}</h1>
      </template>
      <template #end> 
        <Badge class="mr-2" v-if="proposalStore.isDraft" value="Changes Detected" severity="warn"></Badge>
        <SplitButton label="Save" size="small" :model="proposalOptions" @click="triggerSaveProposal" severity="contrast"></SplitButton>
      </template>
    </Toolbar>

    <div class="proposal_editor_container m-2">

      <!-- Left Panel -->
      <aside>
        <Card class="!cursor-default">
          <template #title>Proposal Details</template>
          <template #content>
            <div class="flex flex-col gap-3">
              <div class="flex flex-col">
                <label for="title">Title</label>
                <InputText id="title" v-model="proposalStore.data.title" size="small" />
              </div>
              <div class="flex flex-col">
                <label for="title">Description</label>
                <Textarea v-model="proposalStore.data.description" size="small" fluid auto-resize />
              </div>
              <div class="flex flex-col">
                <label for="title">Name</label>
                <InputText id="title" v-model="proposalStore.data.customer.name" size="small" />
              </div>
              <div class="flex flex-col">
                <label for="expiresOnDate">Expiry Date</label>
                <DatePicker name="expiresOnDate" v-model="proposalStore.data.expiresOnDate" size="small" showIcon dateFormat="yy/mm/dd" fluid />
              </div>
            </div>
          </template>
        </Card>

        <div class="sticky top-16">
          <Card class="mt-4">
            <template #title> 
              <div class="flex justify-between">
                <p>Sections</p>
                <p>({{ proposalStore.data.sections.length + 1 }})</p>
              </div> 
            </template>
            <template #content>

              <!-- Cover Letter, cannot be moved -->
              <li 
                class="border border-gray-300 p-2 rounded-md cursor-default flex items-center mb-2 justify-between"
              >
                  <div>
                    <span class="text-gray-500 pi pi-lock cursor-not-allowed" style="font-size: 14px;"></span>
                    <span href="#cover_letter" class="text-left text-sm ml-2 cursor-text">Cover Letter</span>
                  </div>
                  <a class="text-sm text-gray-500 cursor-pointer pi pi-eye" href="#cover_letter" style="font-size: 14px;"></a>
              </li>

              <Draggable
                v-model="proposalStore.data.sections"
                tag="ul"
                item-key="id"
                class="flex flex-col gap-2"
                ghost-class="bg-gray-200"
                handle=".handle" 
                :animation="200"
              >
                <template #item="{ element : section }">
                  <li 
                    v-if="[SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS, SECTION_TYPES.TOTALS, SECTION_TYPES.MILESTONES].includes(section.type) && section.title.trim()" 
                    class="border border-gray-300 p-2 rounded-md cursor-default flex items-center justify-between"
                  >
                    <div>
                      <span class="text-sm text-gray-500 handle cursor-move pi pi-bars" style="font-size: 14px;"></span>
                      <span class="text-left text-sm ml-2 cursor-text">{{ section.title }}</span>
                    </div>
                    <a class="text-sm text-gray-500 handle cursor-pointer pi pi-eye" :href="`#section_${section.id}`" style="font-size: 14px;"></a>
                  </li>
                </template>
              </Draggable>

              <!-- Terms and Conditions, cannot be moved -->
              <li 
                class="border border-gray-300 p-2 rounded-md cursor-default flex items-center mt-2 justify-between"
              >
                  <div>
                    <span class="text-gray-500 pi pi-lock cursor-not-allowed"  style="font-size: 14px;"></span>
                    <span class="text-left text-sm ml-2 cursor-text">Terms and Conditions</span>
                  </div>
                  <a class="text-sm text-gray-500 handle cursor-pointer pi pi-eye" href="#terms_and_conditions" style="font-size: 14px;"></a>
              </li>
            </template>
          </Card>
          
          <Card class="mt-4 !cursor-default" :class="{ 'pulse-animation': proposalStore.totalsRecalculated }">
            <template #title>Totals</template>
            <template #content>
              <div
                v-for="(values, recurrence) in proposalStore.data._totals"
                :key="proposalStore.changeCount"
                class="flex items-start justify-between p-1 [&:not(:last-child)]:border-b border-b-gray-400"
              >
                <div>
                  <h3 class="text-lg font-medium capitalize">
                    {{ recurrence.toLowerCase().replace('_', ' ') }}
                  </h3>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-400">
                    Cost <span class="inline-block w-24 text-red-500 tabular-nums">{{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(values.cost) }}</span>
                  </p>
                  <p class="text-sm text-gray-400">
                    Margin <span class="inline-block w-24 text-green-500 tabular-nums">{{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(values.margin) }}</span>
                  </p>
                  <p class="text-sm text-black">
                    Total <span class="inline-block w-24 tabular-nums">{{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(values.total) }}</span>
                  </p>
                </div>
              </div>
            </template>
          </Card>

        </div>
      </aside>

      <!-- Main Section -->
      <section id="section-grid" class="mb-4">
        <ProposalSection v-for="section in proposalStore.data.sections" :key="section.id" :data="section" />
      </section>
    
    </div>

  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import Draggable from "vuedraggable";
import { cloneDeep } from 'lodash';

import { concatProposalIdentifier } from '../utils/helpers'
import ProposalSection from '../components/ProposalSection.vue';
import { useProposalStore } from '../store/proposalStore'

import Toast from 'primevue/toast';
import Toolbar from 'primevue/toolbar';
import SplitButton from 'primevue/splitbutton'
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import OrderList from 'primevue/orderlist';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import DatePicker from 'primevue/datepicker';

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

import { GetProposalById, SaveProposal, GetProposalVersions, GetProposalVersion, RevertProposalVersion } from '../api/api'

import { onMounted, onUnmounted, ref } from 'vue'
import { SECTION_TYPES } from '../constants/sections';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const proposalStore = useProposalStore();
const activeSection = ref(null);

const showVersionHistory = ref(false);
const versions = ref([]);
const previewVersion = ref(null);
const previewLoading = ref(null);

const proposalOptions = [
    {
        label: 'New Version',
        command: () => {
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Data Updated', life: 3000 });
        }
    },
    {
      label: 'View History',
      command: () => loadVersionHistory(),
    },
    {
      separator: true
    },
    {
        label: 'Preview PDF',
        command: () => {
            window.open(`http://localhost:5005/pdf/${proposalStore.data.selectedTemplate}/${proposalStore.data.id}`)
        }
    },
    {
        label: 'Download PDF',
        command: () => downloadPdf()
    },
    {
        separator: true
    },
    {
        label: 'Webhook Sync',
        command: () => {
            toast.add({ severity: 'warn', summary: 'Delete', detail: 'Data Deleted', life: 3000 });
        }
    }
];

/**
 * This function takes an array of numbers and returns the sum of all elements.
 *
 * @param {number[]} numbers - An array of numbers to be summed.
 * @returns {number} The sum of all numbers in the array.
 */
async function triggerSaveProposal() {

  const payloadCopy = cloneDeep(proposalStore.data);

  if (payloadCopy._totals && payloadCopy._section_totals) {
    delete payloadCopy._section_totals
    delete payloadCopy._totals;
  }

  await SaveProposal(payloadCopy);
  proposalStore.resetDraftStatus();
  toast.add({ severity: 'success', summary: 'Proposal Saved', detail: 'Proposal has been saved', life: 3000 });
}

async function loadVersionHistory() {
  versions.value = [];
  previewVersion.value = null;
  showVersionHistory.value = true;
  const result = await GetProposalVersions(proposalStore.data.id);
  if (result) versions.value = result;
}

async function loadPreview(versionEntry) {
  previewLoading.value = versionEntry.id;
  const result = await GetProposalVersion(proposalStore.data.id, versionEntry.id);
  previewLoading.value = null;
  if (result) previewVersion.value = result;
}

function confirmRevert(versionEntry) {
  confirm.require({
    message: `Restore the proposal to v${versionEntry.version}? Your current state will be saved as a new version first.`,
    header: 'Restore Version',
    icon: 'pi pi-history',
    acceptLabel: 'Restore',
    rejectLabel: 'Cancel',
    accept: async () => {
      const restored = await RevertProposalVersion(proposalStore.data.id, versionEntry.id);
      if (restored) {
        proposalStore.data = restored;
        proposalStore.recalculateTotals();
        proposalStore.resetDraftStatus();
        previewVersion.value = null;
        showVersionHistory.value = false;
        toast.add({ severity: 'success', summary: 'Restored', detail: `Proposal restored to v${versionEntry.version}`, life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to restore version', life: 3000 });
      }
    },
  });
}

async function downloadPdf() {
  try {
    const domain = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';
    const response = await fetch(`${domain}/api/v1/proposal/${proposalStore.data.id}/pdf`, {
      credentials: 'include',
    });

    if (!response.ok) {
      toast.add({ severity: 'error', summary: 'PDF Error', detail: 'Failed to generate PDF', life: 4000 });
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proposalStore.data.identifier || proposalStore.data.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.add({ severity: 'error', summary: 'PDF Error', detail: 'An error occurred generating the PDF', life: 4000 });
  }
}

// Keyboard Shortcuts
const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      triggerSaveProposal();
    }
};

// Focus Handler
const handleFocus = () => {
    proposalStore.isTabFocused = !!document.hasFocus();
};

onMounted(async () => {

    if (proposalStore.data === null) {

      const proposal = await GetProposalById(route.params.id);
      if (proposal.error) {
        router.push('/');
        toast.add({ severity: 'error', summary: 'Error', detail: proposal.message, life: 3000 })
        return;
      }

      if (proposal) {
        proposalStore.data = proposal;
        proposalStore.recalculateTotals();
        proposalStore.resetDraftStatus();
        
        document.title = `${concatProposalIdentifier(proposalStore.data)} - ${proposalStore.data.title}`;
        window.addEventListener("keydown", handleKeyDown);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleFocus);

        return;
      }
      
    } 
  
});

onUnmounted(() => {
  proposalStore.data = null;
  window.removeEventListener("keydown", handleKeyDown);

  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleFocus);
});
</script>

<style>
  #proposal-editor .p-card-title {
      background: #083e69;
      border: none;
      color: white;
  }

  #proposal-editor .p-card-body {
      border: 1px solid #636363;
      border-radius: 8px;
  }

  .proposal-toolbar {
    max-width: 1830px;
  }

  #proposal-editor .p-toolbar {
    position: sticky !important;
    top: 0;
    padding: 8px 8px !important;
    border: 2px solid #cdcdcd !important;
    border-radius: 0px 0px 8px 8px !important;
    border-top: 0 !important;
    z-index: 40;
  }

  .proposal_editor_container {
    display: grid;
    grid-template-columns: 350px 1430px;
    grid-template-rows: 1fr;
    grid-column-gap: 16px;
  }

  section#section-grid {
    display: grid;
    grid-auto-rows: min-content;
    gap: 16px;
  }

  main p {
    margin: 0;
  }

  .p-card {
    cursor: pointer;
  }

  .p-card-body {
    padding: 0 !important;
    border: 2px solid #cdcdcd;
    border-radius: 8px 8px 0px 0px;
    gap: 0 !important;
  }

  .p-card.active {
    box-shadow: 0px 0px 5px rgb(9 9 9 / 35%);
  }

  .p-card-title {
    background: #cdcdcd;
    border: 1px solid #cdcdcd;
    padding: 8px;
    border-radius: 6px 6px 0px 0px;
  }

  .p-card-content {
    padding: 8px;
  }

  .is_table .p-card-content,
  .is_hidden .p-card-content {
    padding: 0;
  }

  #section-grid {
    box-shadow: 0px 0px 0px #808080;
  }

  #section-grid .is_active {
    transition: 200ms;
    box-shadow: 0px 0px 8px #808080;
  }

  .p-datatable-header-cell {
    padding: 4px 16px !important;
  }

  li[draggable="false"] {
    background-color: white !important;
    color: black !important;
  }

  .pulse-animation {
    animation: pulse 500ms ease-out;
    z-index: 9999;
  }

  @keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
</style>
