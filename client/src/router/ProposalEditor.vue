<template>
  <div id="proposal-editor" v-if="proposalStore.data !== null">

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
              <li class="border border-gray-300 p-2 rounded-md cursor-default flex items-center mb-2 justify-between">
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
                  <li v-if="[SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS, SECTION_TYPES.TOTALS, SECTION_TYPES.MILESTONES].includes(section.type) && section.title.trim()" class="border border-gray-300 p-2 rounded-md cursor-default flex items-center justify-between">
                    <div>
                      <span class="text-sm text-gray-500 handle cursor-move pi pi-bars" style="font-size: 14px;"></span>
                      <span class="text-left text-sm ml-2 cursor-text">{{ section.title }}</span>
                    </div>
                    <a class="text-sm text-gray-500 handle cursor-pointer pi pi-eye" :href="`#section_${section.id}`" style="font-size: 14px;"></a>
                  </li>
                </template>
              </Draggable>
              <li class="border border-gray-300 p-2 rounded-md cursor-default flex items-center mt-2 justify-between">
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
      <section id="section-grid">
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

import { GetProposalById, SaveProposal } from '../api/api'

import { onMounted, onUnmounted, ref } from 'vue'
import { SECTION_TYPES } from '../constants/sections';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const proposalStore = useProposalStore();
const activeSection = ref(null);

const proposalOptions = [
    {
        label: 'New Version',
        command: () => {
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Data Updated', life: 3000 });
        }
    },
    {
        label: 'View History',
        command: () => {
            toast.add({ severity: 'warn', summary: 'Delete', detail: 'Data Deleted', life: 3000 });
        }
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


function setActiveSection(section) {
  activeSection.value = section;
}

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
        return;
      }
      
    } 
  
});

onUnmounted(() => {
  proposalStore.data = null;
});
</script>

<style>
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
    z-index: 200;
  }

  .proposal_editor_container {
    display: grid;
    grid-template-columns: 350px 1430px;
    grid-template-rows: 1fr;
    grid-column-gap: 16px;
  }

  section#section-grid {
    display: grid;
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

  .is_table .p-card-content {
    padding: 0;
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
