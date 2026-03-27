<template>
    <table class="w-full border-collapse border border-gray-300 cursor-auto">
        <thead class="bg-gray-100 text-left text-sm font-medium text-gray-700">
            <tr>
                <th class="p-2 border border-gray-300 text-center w-10"></th>
                <th class="p-2 border border-gray-300">Milestone Details</th>
                <th class="p-2 border border-gray-300 text-right">Amount</th>
            </tr>
        </thead>
        <Draggable
            tag="tbody"
            v-model="section.milestones"
            v-bind="dragOptions"
            handle=".handle"
            item-key="id"
            :animation="200"
        >
            <template #item="{ element: milestone }">
                <tr class="milestone-row hover:bg-gray-50 odd:bg-white even:bg-gray-50 transition ease-in-out delay-150 relative">
                    <td class="p-2 border border-gray-300 text-center text-gray-500 w-10 align-top">
                        <span class="inline-block handle cursor-move">⋮⋮</span>
                        <div class="milestone-shortcuts">
                            <span class="milestone-shortcut delete pi pi-trash" title="Delete milestone" @click="proposalStore.deleteSectionMilestone(section.id, milestone.id)"></span>
                            <span class="milestone-shortcut pi pi-clone" title="Duplicate milestone" @click="proposalStore.duplicateMilestone(section.id, milestone)"></span>
                        </div>
                    </td>
                    <td class="p-2 border border-gray-300">
                        <InputText placeholder="Milestone Title" v-model="milestone.title" inputClass="w-full title" size="small" fluid />
                        <Editor placeholder="Description..." v-model="milestone.description" class="mt-2 description" editor-style="height: 150px; max-height: 500px; overflow-y: auto;" />
                    </td>
                    <td class="p-2 border border-gray-300 text-right align-top">
                        <InputNumber @value-change="proposalStore.recalculateMilestones(section.id, section)" v-model="milestone.amount" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                    </td>
                </tr>
            </template>
            <template #footer>
                <tr>
                    <td class="p-2 bg-gray-200" colspan="1"></td>
                    <td class="p-2 pr-3 text-right w-25 font-semibold bg-gray-200" :class="{ 'text-red-500': section._milestone_totals?.remaining as number < 0 }">
                        <span v-tooltip.top="'Unallocated'">
                            {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(section._milestone_totals?.remaining ?? 0) }}
                        </span>
                    </td>
                    <td class="p-2 pr-3 text-right w-25 font-semibold bg-gray-200">
                        <span v-tooltip.top="'Allocated'">
                            {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(section._milestone_totals?.allocated ?? 0) }}
                        </span>
                    </td>
                </tr>
            </template>
        </Draggable>
    </table>
    <div v-if="section.milestones && section.milestones.length === 0" class="grid place-content-center p-24">
        <h3>No milestones...</h3>
    </div>
</template>

<script setup lang="ts">
import Draggable from 'vuedraggable';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Editor from 'primevue/editor';

import { useProposalStore } from '../store/proposalStore';
import type { Section } from '../types/Proposal';

defineProps<{ section: Section }>();

const proposalStore = useProposalStore();

const dragOptions = {
    animation: 200,
    group: 'description',
    disabled: false,
    ghostClass: 'ghost',
};
</script>

<style>
.milestone-row .milestone-shortcuts {
    visibility: hidden;
    cursor: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: absolute;
    top: 0;
    padding-left: 8px !important;
    right: -42px;
    height: 100%;
}

.milestone-shortcuts:hover,
.milestone-row:hover .milestone-shortcuts {
    visibility: visible;
}

.milestone-row .milestone-shortcut {
    padding: 8px;
    background: white;
    border: 2px solid #cdcdcd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 200ms;
}

.milestone-shortcuts .milestone-shortcut:hover {
    border-color: black;
    background-color: black;
    color: white;
}

.milestone-shortcuts .milestone-shortcut.delete:hover {
    border-color: rgb(143, 0, 0);
    background-color: rgb(143, 0, 0);
}
</style>
