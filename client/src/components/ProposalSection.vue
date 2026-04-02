<template>

    <CataloguePickerDialog />

    <div
        @mouseenter="onSectionEnter"
        @mouseleave="onSectionLeave"
    >
        <Card
            :key="section.id"
            :class="{
                is_table: isTableContent(section.type),
                is_hidden: !sectionVisbility,
                is_active: sectionIsEntered
            }"
        >
            <template #title>
                <SectionHeader
                    :section="section"
                    :visibility="sectionVisbility"
                    :open-catalogue-picker="openCataloguePicker"
                    @update:visibility="sectionVisbility = $event"
                />
            </template>

            <template #content>
                <component
                    v-if="sectionVisbility && SECTION_COMPONENT_MAP[section.type]"
                    :is="SECTION_COMPONENT_MAP[section.type]"
                    :section="section"
                    :open-catalogue-picker="openCataloguePicker"
                />
            </template>
        </Card>

        <div v-if="[ SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS, SECTION_TYPES.TOTALS, SECTION_TYPES.MILESTONES ].includes(section.type)" class="add-section-container mt-4 w-full flex justify-center items-center relative">
            <SpeedDial :model="proposalSectionOptions(section.id)" direction="right" :style="{ position: 'absolute', top: '-7px' }" />
        </div>

    </div>

</template>

<script setup lang="ts">
import { ref, provide } from 'vue';
import type { Component } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import SpeedDial from 'primevue/speeddial';

import { useProposalStore } from '../store/proposalStore';
import { SECTION_TYPES } from '../constants/sections';
import { isTableContent } from '../composables/useSectionTypeChecks';
import { useCataloguePicker } from '../composables/useCataloguePicker';

import CataloguePickerDialog from './CataloguePickerDialog.vue';
import SectionHeader from './SectionHeader.vue';
import SectionInfoEditor from './SectionInfoEditor.vue';
import SectionProductsTable from './SectionProductsTable.vue';
import SectionTotalsTable from './SectionTotalsTable.vue';
import SectionMilestonesTable from './SectionMilestonesTable.vue';

const SECTION_COMPONENT_MAP: Record<string, Component> = {
    [SECTION_TYPES.COVER_LETTER]: SectionInfoEditor,
    [SECTION_TYPES.INFO]: SectionInfoEditor,
    [SECTION_TYPES.PRODUCTS]: SectionProductsTable,
    [SECTION_TYPES.TOTALS]: SectionTotalsTable,
    [SECTION_TYPES.MILESTONES]: SectionMilestonesTable,
    [SECTION_TYPES.TERMS_AND_CONDITIONS]: SectionInfoEditor,
};

const toast = useToast();
const proposalStore = useProposalStore();

const { data: section } = defineProps(['data']);

const sectionIsEntered = ref<boolean>(false);
const sectionVisbility = ref<boolean>(true);

const {
    catalogueDialogVisible,
    catalogueItems,
    catalogueLoading,
    catalogueSearch,
    openCataloguePicker,
    onCatalogueSearch,
    onCatalogueRowClick,
    formatCataloguePrice,
} = useCataloguePicker();

provide('catalogueDialogVisible', catalogueDialogVisible);
provide('catalogueItems', catalogueItems);
provide('catalogueLoading', catalogueLoading);
provide('catalogueSearch', catalogueSearch);
provide('onCatalogueSearch', onCatalogueSearch);
provide('onCatalogueRowClick', onCatalogueRowClick);
provide('formatCataloguePrice', formatCataloguePrice);

const proposalSectionOptions = (sectionId: number) => [
    {
        label: 'Products',
        icon: 'pi pi-box',
        command: () => {
            proposalStore.addSectionToProposal(sectionId, 'PRODUCT');
            toast.add({ severity: 'info', summary: 'Added Section', detail: 'Added new products section to proposal', life: 3000 });
        }
    },
    {
        label: 'Info',
        icon: 'pi pi-pen-to-square',
        command: () => {
            proposalStore.addSectionToProposal(sectionId, 'INFO');
            toast.add({ severity: 'info', summary: 'Added Section', detail: 'Added new info section to proposal', life: 3000 });
        }
    },
    {
        label: 'Totals',
        icon: 'pi pi-dollar',
        command: () => {
            proposalStore.addSectionToProposal(sectionId, 'TOTALS');
            toast.add({ severity: 'info', summary: 'Added Section', detail: 'Added new totals section to proposal', life: 3000 });
        }
    },
    {
        label: 'Milestones',
        icon: 'pi pi-sort-numeric-down',
        command: () => {
            proposalStore.addSectionToProposal(sectionId, 'MILESTONES');
            toast.add({ severity: 'info', summary: 'Added Section', detail: 'Added new milestones section to proposal', life: 3000 });
        }
    }
];

function onSectionEnter() { sectionIsEntered.value = true; }
function onSectionLeave() { sectionIsEntered.value = false; }
</script>

<style>
    .add-section-container {
        height: 25px;
    }

    .add-section-container:hover {
        opacity: 1;
        transition: all 500ms;
    }

    .section-header-left {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: 1fr;
        grid-column-gap: 8px;
        width: 100%;
    }

    .section-header-left input.section-title {
        font-size: 20px;
        padding: 0;
        background-color: #083e69;
        border-color: #083e69;
        color: white;
        box-shadow: none;
    }

    .section-header-left input.section-title:hover {
        border-color: #ffffff;
    }

    .section-header-left input.section-title:focus {
        font-size: 20px;
        padding: 0;
        color: #083e69;
        background-color: #ffffff;
    }

    .add-section-container .p-speeddial-open .p-speeddial-list {
        transition: all 200ms;
        background: white;
        margin-top: -10px;
        padding: 8px;
        top: -8px;
        border-radius: 30px;
        box-shadow: 0px 4px 9px #0000008f;
        flex-direction: row;
    }

    .add-section-container .p-speeddial .p-speeddial-button {
        transform: scale(0.6) !important;
    }

    .add-section-container .p-speeddial .p-speeddial-button {
        background: black !important;
        border-color: black !important;
    }

    /* Vue Draggable */
    .ghost {
        opacity: 0.25;
        background: #c8ebfb;
    }

    .flip-list-move {
        transition: transform 1s;
    }

    .no-move {
        transition: transform 0s;
    }

    /* Smooth Scroll */
    html {
        scroll-behavior: smooth;
    }

    :target {
        scroll-margin-top: 4.5rem;
    }
</style>
