<template>

    <CataloguePickerDialog />

    <div
        class="proposal-section-wrap"
        @mouseenter="onSectionEnter"
        @mouseleave="onSectionLeave"
    >
        <section
            :key="section.id"
            class="swift-panel proposal-section"
            :class="{
                'is-table': isTableContent(section.type),
                'is-hidden': !sectionVisibility,
                'is-active': sectionIsEntered,
            }"
        >
            <header class="swift-panel__header proposal-section__header">
                <SectionHeader
                    :section="section"
                    :visibility="sectionVisibility"
                    :open-catalogue-picker="openCataloguePicker"
                    @update:visibility="sectionVisibility = $event"
                />
            </header>

            <div class="swift-panel__body" :class="{ 'swift-panel__body--flush': isTableContent(section.type) }">
                <component
                    v-if="sectionVisibility && SECTION_COMPONENT_MAP[section.type]"
                    :is="SECTION_COMPONENT_MAP[section.type]"
                    :section="section"
                    :open-catalogue-picker="openCataloguePicker"
                />
            </div>
        </section>

        <div v-if="canAppend" class="add-section-container">
            <SpeedDial :model="proposalSectionOptions(section.id)" direction="right" />
        </div>

    </div>

</template>

<script setup lang="ts">
import { computed, ref, provide } from 'vue';
import type { Component } from 'vue';
import type { Section } from '../types/Proposal';
import { useToast } from 'primevue/usetoast';
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

const APPEND_TYPES = [SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS, SECTION_TYPES.TOTALS, SECTION_TYPES.MILESTONES];

const toast = useToast();
const proposalStore = useProposalStore();

const { data: section } = defineProps<{ data: Section }>();

const sectionIsEntered = ref<boolean>(false);
const sectionVisibility = ref<boolean>(true);

const canAppend = computed(() => APPEND_TYPES.includes(section.type));

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

<style scoped>
.proposal-section-wrap {
    margin-bottom: var(--s-5);
}

.proposal-section {
    transition: border-color 120ms ease, box-shadow 120ms ease;
}
.proposal-section.is-active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent-bg);
}
.proposal-section.is-hidden .swift-panel__body {
    display: none;
}

.proposal-section__header {
    height: auto;
    min-height: 36px;
    padding: var(--s-3) var(--s-4);
}

.add-section-container {
    height: 24px;
    margin-top: var(--s-3);
    display: flex;
    justify-content: center;
    position: relative;
    opacity: 0.4;
    transition: opacity 200ms;
}
.add-section-container:hover {
    opacity: 1;
}
.add-section-container :deep(.p-speeddial-open .p-speeddial-list) {
    background: var(--surface-100);
    border-radius: var(--r-pill);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    padding: var(--s-2);
    flex-direction: row;
    margin-top: -8px;
}
.add-section-container :deep(.p-speeddial .p-speeddial-button) {
    transform: scale(0.6);
    background: var(--accent) !important;
    border-color: var(--accent) !important;
}
</style>

<style>
/* Vue Draggable shared styles */
.ghost {
    opacity: 0.25;
    background: var(--accent-bg);
}
.flip-list-move { transition: transform 1s; }
.no-move { transition: transform 0s; }

html { scroll-behavior: smooth; }
:target { scroll-margin-top: 4.5rem; }
</style>
