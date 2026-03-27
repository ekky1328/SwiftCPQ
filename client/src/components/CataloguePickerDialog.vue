<template>
    <Dialog v-model:visible="catalogueDialogVisible" header="Add from Catalogue" modal style="width: 640px">
        <div class="flex flex-col gap-3 pt-1">
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="catalogueSearch" placeholder="Search catalogue..." fluid @input="onCatalogueSearch" />
            </IconField>
            <DataTable
                :value="catalogueItems"
                :loading="catalogueLoading"
                size="small"
                striped-rows
                selection-mode="single"
                data-key="id"
                @row-click="onCatalogueRowClick"
                style="cursor: pointer"
            >
                <template #empty><p class="text-center py-6 text-gray-400">No items found.</p></template>
                <Column field="sku" header="SKU" style="width: 100px" />
                <Column field="title" header="Title" />
                <Column field="price" header="Price" style="width: 110px">
                    <template #body="{ data: row }">{{ formatCataloguePrice(row.price) }}</template>
                </Column>
                <Column field="type" header="Type" style="width: 90px">
                    <template #body="{ data: row }">
                        <Tag :value="row.type" :severity="row.type === 'PRODUCT' ? 'info' : 'secondary'" />
                    </template>
                </Column>
            </DataTable>
            <p class="text-xs text-gray-400">Click a row to add it to the section.</p>
        </div>
        <template #footer>
            <Button label="Close" severity="secondary" @click="catalogueDialogVisible = false" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import type { Ref } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';

const catalogueDialogVisible = inject<Ref<boolean>>('catalogueDialogVisible')!;
const catalogueItems = inject<Ref<any[]>>('catalogueItems')!;
const catalogueLoading = inject<Ref<boolean>>('catalogueLoading')!;
const catalogueSearch = inject<Ref<string>>('catalogueSearch')!;
    
const onCatalogueSearch = inject<() => void>('onCatalogueSearch')!;
const onCatalogueRowClick = inject<(event: { data: any }) => void>('onCatalogueRowClick')!;
const formatCataloguePrice = inject<(value: number) => string>('formatCataloguePrice')!;
</script>
