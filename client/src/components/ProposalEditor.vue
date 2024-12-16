
<script setup>
import ProposalSection from './ProposalSection.vue';

import { useProposalStore } from '../store/proposalStore'

import Toolbar from 'primevue/toolbar';
import SplitButton from 'primevue/splitbutton'
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import OrderList from 'primevue/orderlist';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

import { GetProposalById, SaveProposal } from '../api/api'

import { onMounted, ref } from 'vue'

const proposalStore = useProposalStore();
const activeSection = ref(null);

const items = [
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
}

onMounted(async function() {
  proposalStore.data = await GetProposalById('1');
});
</script>

<template>
  <div id="proposal-editor">
    <Toolbar class="m-2 bg-white border !border-gray-400">
      <template #end> 
        <SplitButton label="Save" size="small" :model="items" @click="triggerSaveProposal" severity="contrast"></SplitButton>
      </template>
    </Toolbar>

    <div class="proposal_editor_container m-2" v-if="proposalStore.data">

      <!-- Left Panel -->
      <aside>
        <Card>
          <template #title>Proposal Details</template>
          <template #content>
            <div class="flex flex-col gap-3">
              <div class="flex flex-col">
                <label for="title">Title</label>
                <InputText id="title" v-model="proposalStore.data.title" size="small" />
              </div>
              <div class="flex flex-col">
                <label for="title">Description</label>
                <Textarea v-model="proposalStore.data.description" size="small" fluid autoResize />
              </div>
              <div class="flex flex-col">
                <label for="title">Name</label>
                <InputText id="title" v-model="proposalStore.data.customer.name" size="small" />
              </div>
            </div>
          </template>
        </Card>

        <Card class="mt-4">
          <template #content>
            <OrderList v-model="proposalStore.data.sections" dataKey="id" breakpoint="575px" pt:pcListbox:root="w-full sm:w-56">
                <template #option="{ option }">
                    {{ option.title }}
                </template>
            </OrderList>
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

<style>
  #proposal-editor {
    max-width: 1920px;
  }

  .proposal_editor_container {
    display: grid;
    grid-template-columns: 350px 1fr;
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

  .p-textarea {
    border-width: 2px !important;
    border-style: dashed !important;
  }

  .p-textarea:focus {
    border-width: 2px !important;
    border-style: solid !important;
  }
</style>
