
<template>
  <div id="proposal-editor" v-if="proposalStore.data !== null">

    <Toolbar class="proposal-toolbar m-2 mt-0 !border-none">
      <template #start> 
        <h1 class="m-0 text-3xl">{{ proposalStore.data.identifier }}</h1>
      </template>
      <template #end> 
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

        <Card class="mt-4">
          <template #title>Sections</template>
          <template #content>
            <Draggable
              v-model="proposalStore.data.sections"
              tag="ul"
              item-key="id"
              class="flex flex-col gap-2"
              ghost-class="bg-gray-200"
              :animation="200"
            >
              <template #item="{ element : section }">
                <li v-if="[SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS].includes(section.type)" class="cursor-move border border-gray-300 p-2 rounded-md flex items-center">
                  <span class="text-sm text-gray-500">⋮⋮</span>
                  <span class="text-left text-sm ml-2">{{ section.title }}</span>
                </li>
              </template>
            </Draggable>
          </template>
        </Card>
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

async function triggerSaveProposal() {
  await SaveProposal(proposalStore.data);
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
        proposalStore.data = proposal
        document.title = `${proposalStore.data.identifier} - ${proposalStore.data.title}`;
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
    max-width: 1965px;
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
    grid-template-columns: 350px 1600px auto;
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

  .is_product .p-card-content {
    padding: 0;
  }

  .p-datatable-header-cell {
    padding: 4px 16px !important;
  }

  li[draggable="false"] {
    background-color: white !important;
    color: black !important;
  }
</style>
