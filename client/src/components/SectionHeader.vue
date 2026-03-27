<template>
    <div class="grid grid-cols-[25px_1fr_auto] gap-1 items-center cursor-auto" :id="createSectionId(section)">
        <div class="cursor-pointer flex justify-center">
            <span v-if="section.isLocked" class="pi pi-lock" v-tooltip.top="`Locked`"></span>
            <span v-else-if="SECTION_TYPES.INFO === section.type" class="pi pi-file" v-tooltip.top="`Text`"></span>
            <span v-else-if="SECTION_TYPES.TOTALS === section.type" class="pi pi-dollar" v-tooltip.top="`Totals`"></span>
            <span v-else-if="SECTION_TYPES.MILESTONES === section.type" class="pi pi-sort-numeric-down" v-tooltip.top="`Milestones`"></span>
            <span v-else-if="SECTION_RECURRANCE.ONE_TIME === section.recurrance" class="pi pi-tag" v-tooltip.top="`One Time`"></span>
            <span v-else class="pi pi-sync" v-tooltip.top="`${capitalize(section.recurrance as string)}`"></span>
        </div>
        <div class="section-header-left">
            <span v-if="![ SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS, SECTION_TYPES.TOTALS, SECTION_TYPES.MILESTONES ].includes(section.type)">
                {{ section.title }}
            </span>
            <InputText
                v-if="[ SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS, SECTION_TYPES.TOTALS, SECTION_TYPES.MILESTONES ].includes(section.type)"
                placeholder="Section Title"
                class="section-title !px-1 focus:!border-white"
                v-model="section.title"
                size="small"
                fluid
            />
        </div>
        <div class="section-header-right flex gap-2 justify-between items-center relative">
            <SplitButton
                v-if="[ SECTION_TYPES.INFO, SECTION_TYPES.PRODUCTS, SECTION_TYPES.TOTALS, SECTION_TYPES.MILESTONES ].includes(section.type)"
                label=""
                icon="pi pi-cog"
                size="small"
                :model="sectionProductOptions(section)"
                @click="toggleSectionSettings"
                severity="contrast"
            />
            <Popover ref="sectionSettings">
                <div class="card p-1 flex flex-col gap-2">
                    <span class="font-medium block">Section Settings</span>
                    <template v-if="isProducts(section.type)">
                        <div class="flex flex-col">
                            <label class="text-sm">Section Recurrance</label>
                            <Select
                                v-model="section.recurrance"
                                :options="sectionRecurranceOptions"
                                optionLabel="name"
                                optionValue="value"
                                size="small"
                                placeholder="Select a recurrance type"
                                class="w-full md:w-56"
                                @change="proposalStore.recalculateSectionItem(section.id, section.items?.[0]?.id ?? 0, 'QTY')"
                            />
                        </div>
                        <div class="flex flex-col gap-2 border rounded-md p-2">
                            <div class="flex flex-row justify-between items-center">
                                <label class="text-sm">Visibility</label>
                                <ToggleSwitch :model-value="visibility" @update:model-value="emit('update:visibility', $event)" />
                            </div>
                        </div>
                        <div class="flex flex-col gap-2 border rounded-md p-2">
                            <div class="flex flex-row justify-between">
                                <label class="text-sm">Optional</label>
                                <ToggleSwitch v-model="section.isOptional" />
                            </div>
                            <div class="flex flex-row justify-between">
                                <label class="text-sm">Reference Only</label>
                                <ToggleSwitch v-model="section.isReference" />
                            </div>
                            <div class="flex flex-row justify-between">
                                <label class="text-sm">Lock Section</label>
                                <ToggleSwitch v-model="section.isLocked" />
                            </div>
                        </div>
                    </template>
                </div>
            </Popover>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { capitalize } from 'lodash';
import { useToast } from 'primevue/usetoast';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import InputText from 'primevue/inputtext';
import SplitButton from 'primevue/splitbutton';
import Popover from 'primevue/popover';

import { useProposalStore } from '../store/proposalStore';
import { SECTION_RECURRANCE, SECTION_TYPES } from '../constants/sections';
import { PRODUCT_TYPES } from '../constants/products';
import { isProducts, createSectionId } from '../composables/useSectionTypeChecks';
import type { Section } from '../types/Proposal';

const props = defineProps<{
    section: Section;
    visibility: boolean;
    openCataloguePicker: (sectionId: number) => void;
}>();

const emit = defineEmits<{
    'update:visibility': [value: boolean];
}>();

const toast = useToast();
const proposalStore = useProposalStore();

const sectionSettings = ref<any>(null);
const sectionRecurranceOptions = ref([
    { name: 'One Time', value: 'ONE_TIME' },
    { name: 'Daily', value: 'DAILY' },
    { name: 'Weekly', value: 'WEEKLY' },
    { name: 'Monthly', value: 'MONTHLY' },
    { name: 'Yearly', value: 'YEARLY' },
]);

function toggleSectionSettings(event: any) {
    sectionSettings.value.toggle(event);
}

function addItemToSection(sectionId: number, itemType: string) {
    proposalStore.addItemToSection(sectionId, itemType);
    switch (itemType) {
        case PRODUCT_TYPES.PRODUCT:
            toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added product to section', life: 3000 });
            break;
        case PRODUCT_TYPES.COMMENT:
            toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added comment to section', life: 3000 });
            break;
    }
}

function addMilestoneToSection(sectionId: number) {
    proposalStore.addMilestoneToSection(sectionId);
    toast.add({ severity: 'success', summary: 'Added Milestone', detail: 'Added milestone to section', life: 3000 });
}

const sectionProductOptions = (section: Section) => {
    let options: any[] = [];

    if (section.type === SECTION_TYPES.PRODUCTS) {
        options = [
            ...options,
            { label: 'Add Product', command: () => addItemToSection(section.id, PRODUCT_TYPES.PRODUCT) },
            { label: 'Add Comment', command: () => addItemToSection(section.id, PRODUCT_TYPES.COMMENT) },
            { label: 'Add from Catalogue', command: () => props.openCataloguePicker(section.id) },
        ];
    }

    if (section.type === SECTION_TYPES.MILESTONES) {
        options = [{ label: 'Add Milestone', command: () => addMilestoneToSection(section.id) }];
    }

    return [
        ...options,
        {
            label: 'Duplicate',
            command: () => {
                proposalStore.duplicateSection(section);
                toast.add({ severity: 'success', summary: 'Duplicated Section', detail: 'Section has been duplicated', life: 3000 });
            }
        },
        { separator: true },
        {
            label: 'Delete',
            command: () => {
                proposalStore.deleteSection(section.id);
                toast.add({ severity: 'error', summary: 'Deleted Section', detail: 'Section has been deleted', life: 5000 });
            }
        },
    ];
};
</script>
