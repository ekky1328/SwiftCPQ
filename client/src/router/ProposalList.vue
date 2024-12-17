<template>
    <div id="proposal-list" class="ml-2">
        <Toolbar class="proposal-toolbar m-2 !px-0 !bg-transparent !border-none">
            <template #start> 
                <h1 class="m-0 text-3xl">All Proposals</h1>
            </template>
            <template #end> 
                <SplitButton label="New Proposal" icon="pi pi-plus" size="small" :model="proposalOptions" @click="triggerCreateNewProposal" severity="contrast"></SplitButton>
            </template>
        </Toolbar>
        <Card>
            <template #content class="p-0">
                <DataTable :value="proposals" :loading="isLoading">
                    <Column header="Id" class="w-32">
                        <template #body="{ data }">
                            <router-link :to="`/proposals/${data.id}`" class="underline">{{ data.identifier }}</router-link>
                        </template>
                    </Column>
                    <Column field="title" header="Title"></Column>
                    <Column field="customer" header="Customer"></Column>
                    <Column field="version" header="Version" class="w-20"></Column>
                    <Column header="Created Date" class="w-44">
                        <template #body="{ data }">
                            <span>{{ formatDate(data.createdOnDate) }}</span>
                        </template>
                    </Column>
                    <Column header="Last Modified Date" class="w-44">
                        <template #body="{ data }">
                            <span>{{ formatDate(data.modifiedOnDate) }}</span>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { CreateNewProposal, GetProposals } from '../api/api';

import { Toolbar, Card, Column, DataTable, Button, SplitButton } from 'primevue';
import { useRouter } from 'vue-router';
import { formatDate } from '../utils/date';
import { useProposalStore } from '../store/proposalStore';

const router = useRouter();

const proposalStore = useProposalStore()

const proposals = ref([]);
const isLoading = ref(true);

const proposalOptions = [
    {
        label: 'View Templates',
        command: () => {
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Data Updated', life: 3000 });
        }
    }
]

async function triggerCreateNewProposal() {
    isLoading.value = true;
    const data = await CreateNewProposal();
    proposalStore.data = data;

    router.push(`/proposals/${data.id}`);
    setTimeout(() => {
        isLoading.value = false;
    }, 1000);

    return;
}

onMounted(async () => {
    const data = await GetProposals();
    proposals.value = data;
    setTimeout(() => {
        isLoading.value = false;
    }, 1000)
})
</script>

<style>
#proposal-list {
    max-width: 1260px;
}

#proposal-list .p-card-content {
    padding: 0 !important;
}
</style>