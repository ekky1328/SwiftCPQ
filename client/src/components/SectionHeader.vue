<template>
    <header class="section-header" :id="createSectionId(section)">
        <span class="section-icon" v-tooltip.top="iconTooltip">{{ iconGlyph }}</span>

        <div class="section-title-wrap">
            <span v-if="!isEditableType" class="section-title-static">{{ section.title }}</span>
            <input
                v-else
                v-model="section.title"
                placeholder="Section Title"
                class="swift-input section-title-input"
            />
        </div>

        <div class="section-header-right">
            <Tag v-if="section.isLocked" kind="warn" dot>Locked</Tag>
            <Tag v-if="section.isOptional">Optional</Tag>
            <Tag v-if="section.isReference">Reference</Tag>

            <Btn v-if="isEditableType" variant="ghost" icon="settings" title="Section Settings" @click="toggleSectionSettings" />
            <Btn v-if="isEditableType" variant="ghost" icon="kebab" title="Section Actions" @click="toggleActions" />

            <Popover ref="sectionSettings">
                <div class="settings-pop">
                    <span class="pop-title">Section Settings</span>
                    <template v-if="isProducts(section.type)">
                        <div class="pop-field">
                            <label>Section Recurrance</label>
                            <Select
                                v-model="section.recurrance"
                                :options="sectionRecurranceOptions"
                                optionLabel="name"
                                optionValue="value"
                                size="small"
                                placeholder="Select a recurrance type"
                                @change="proposalStore.recalculateSectionItem(section.id, section.items?.[0]?.id ?? 0, 'QTY')"
                            />
                        </div>
                        <div class="pop-group">
                            <div class="pop-toggle">
                                <label>Visibility</label>
                                <ToggleSwitch :model-value="visibility" @update:model-value="emit('update:visibility', $event)" />
                            </div>
                        </div>
                        <div class="pop-group">
                            <div class="pop-toggle">
                                <label>Optional</label>
                                <ToggleSwitch v-model="section.isOptional" />
                            </div>
                            <div class="pop-toggle">
                                <label>Reference Only</label>
                                <ToggleSwitch v-model="section.isReference" />
                            </div>
                            <div class="pop-toggle">
                                <label>Lock Section</label>
                                <ToggleSwitch v-model="section.isLocked" />
                            </div>
                        </div>
                    </template>
                </div>
            </Popover>

            <Popover ref="sectionActions">
                <div class="settings-pop">
                    <span class="pop-title">Section Actions</span>
                    <div class="pop-actions">
                        <template v-if="section.type === SECTION_TYPES.PRODUCTS">
                            <Btn variant="default" @click="addItemToSection(section.id, PRODUCT_TYPES.PRODUCT)">Add Product</Btn>
                            <Btn variant="default" @click="addItemToSection(section.id, PRODUCT_TYPES.COMMENT)">Add Comment</Btn>
                            <Btn variant="default" icon="db" @click="openCataloguePicker(section.id)">From Catalogue</Btn>
                        </template>
                        <template v-if="section.type === SECTION_TYPES.MILESTONES">
                            <Btn variant="default" @click="addMilestoneToSection(section.id)">Add Milestone</Btn>
                        </template>
                        <Btn variant="default" icon="duplicate" @click="duplicateSection">Duplicate Section</Btn>
                        <Btn variant="danger" icon="trash" @click="deleteSection">Delete Section</Btn>
                    </div>
                </div>
            </Popover>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { capitalize } from 'lodash';
import { useToast } from 'primevue/usetoast';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import Popover from 'primevue/popover';

import Btn from '../ui/Btn.vue';
import Tag from '../ui/Tag.vue';

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
const sectionActions = ref<any>(null);
const sectionRecurranceOptions = ref([
    { name: 'One Time', value: 'ONE_TIME' },
    { name: 'Daily', value: 'DAILY' },
    { name: 'Weekly', value: 'WEEKLY' },
    { name: 'Monthly', value: 'MONTHLY' },
    { name: 'Yearly', value: 'YEARLY' },
]);

const EDITABLE_TYPES = [
    SECTION_TYPES.INFO,
    SECTION_TYPES.PRODUCTS,
    SECTION_TYPES.TOTALS,
    SECTION_TYPES.MILESTONES,
];

const isEditableType = computed(() => EDITABLE_TYPES.includes(props.section.type));

const iconGlyph = computed(() => {
    if (props.section.isLocked) return '▢';
    if (props.section.type === SECTION_TYPES.INFO) return '✎';
    if (props.section.type === SECTION_TYPES.TOTALS) return '$';
    if (props.section.type === SECTION_TYPES.MILESTONES) return '⌘';
    if (props.section.recurrance === SECTION_RECURRANCE.ONE_TIME) return '◆';
    return '↻';
});

const iconTooltip = computed(() => {
    if (props.section.isLocked) return 'Locked';
    if (props.section.type === SECTION_TYPES.INFO) return 'Text';
    if (props.section.type === SECTION_TYPES.TOTALS) return 'Totals';
    if (props.section.type === SECTION_TYPES.MILESTONES) return 'Milestones';
    if (props.section.recurrance === SECTION_RECURRANCE.ONE_TIME) return 'One Time';
    return capitalize(props.section.recurrance as string);
});

function toggleSectionSettings(event: any) {
    sectionSettings.value.toggle(event);
}

function toggleActions(event: any) {
    sectionActions.value.toggle(event);
}

function addItemToSection(sectionId: number, itemType: string) {
    proposalStore.addItemToSection(sectionId, itemType);
    if (itemType === PRODUCT_TYPES.PRODUCT) {
        toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added product to section', life: 3000 });
    } else if (itemType === PRODUCT_TYPES.COMMENT) {
        toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added comment to section', life: 3000 });
    }
}

function addMilestoneToSection(sectionId: number) {
    proposalStore.addMilestoneToSection(sectionId);
    toast.add({ severity: 'success', summary: 'Added Milestone', detail: 'Added milestone to section', life: 3000 });
}

function duplicateSection() {
    proposalStore.duplicateSection(props.section);
    toast.add({ severity: 'success', summary: 'Duplicated Section', detail: 'Section has been duplicated', life: 3000 });
}

function deleteSection() {
    proposalStore.deleteSection(props.section.id);
    toast.add({ severity: 'error', summary: 'Deleted Section', detail: 'Section has been deleted', life: 5000 });
}
</script>

<style scoped>
.section-header {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    gap: var(--s-3);
    align-items: center;
    width: 100%;
}

.section-icon {
    color: var(--text-3);
    font-size: 14px;
    text-align: center;
    line-height: 1;
}

.section-title-wrap {
    min-width: 0;
}
.section-title-static {
    font-size: var(--fs-md);
    color: var(--text-1);
    font-weight: 500;
}
.section-title-input {
    width: 100%;
    height: 28px;
    font-size: var(--fs-md);
    font-weight: 500;
    background: transparent;
    border-color: transparent;
    color: var(--text-1);
}
.section-title-input:hover { border-color: var(--border); }
.section-title-input:focus {
    background: var(--surface-100);
    border-color: var(--accent);
}

.section-header-right {
    display: flex;
    align-items: center;
    gap: var(--s-2);
}

.settings-pop {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    min-width: 240px;
    color: var(--text-1);
}
.pop-title {
    font-weight: 500;
    font-size: var(--fs-md);
    color: var(--text-1);
}
.pop-field {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
}
.pop-field label {
    font-size: var(--fs-sm);
    color: var(--text-2);
}
.pop-group {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--s-3);
}
.pop-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.pop-toggle label {
    font-size: var(--fs-sm);
    color: var(--text-2);
}
.pop-actions {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
}
</style>
