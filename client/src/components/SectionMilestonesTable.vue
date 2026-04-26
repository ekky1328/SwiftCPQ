<template>
    <table class="swift-table milestones-table">
        <thead>
            <tr>
                <th class="col-handle"></th>
                <th>Milestone Details</th>
                <th class="col-currency">Amount</th>
                <th class="col-actions"></th>
            </tr>
        </thead>
        <Draggable
            tag="tbody"
            v-model="section.milestones"
            v-bind="dragOptions"
            handle=".drag-handle"
            item-key="id"
            :animation="200"
        >
            <template #item="{ element: milestone }">
                <tr class="row-milestone">
                    <td class="col-handle">
                        <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                    </td>
                    <td class="col-detail">
                        <InlineEditCell
                            type="text"
                            :model-value="milestone.title"
                            @commit="(v) => { milestone.title = String(v); }"
                        />
                        <Editor
                            placeholder="Description..."
                            v-model="milestone.description"
                            class="milestone-editor"
                            editor-style="min-height: 120px; max-height: 500px; overflow-y: auto;"
                        />
                    </td>
                    <td class="col-currency col-amount">
                        <InlineEditCell
                            type="price"
                            :model-value="milestone.amount"
                            @commit="(v) => { milestone.amount = Number(v); proposalStore.recalculateMilestones(section.id, section); }"
                        />
                    </td>
                    <td class="col-actions">
                        <div class="row-actions">
                            <Btn variant="ghost" icon="duplicate" title="Duplicate" @click="proposalStore.duplicateMilestone(section.id, milestone)" />
                            <Btn variant="ghost" icon="trash" title="Delete" @click="proposalStore.deleteSectionMilestone(section.id, milestone.id)" />
                        </div>
                    </td>
                </tr>
            </template>
            <template #footer>
                <tr v-if="section.milestones && section.milestones.length === 0" class="row-empty">
                    <td colspan="4">
                        <div class="empty-state"><h3>No milestones</h3></div>
                    </td>
                </tr>
                <tr v-else class="row-totals">
                    <td colspan="2" class="col-label">
                        <span v-tooltip.top="'Unallocated'" :class="{ 'amount-negative': (section._milestone_totals?.remaining ?? 0) < 0 }">
                            Unallocated: {{ formatCurrency(section._milestone_totals?.remaining ?? 0) }}
                        </span>
                    </td>
                    <td class="col-currency" v-tooltip.top="'Allocated'">
                        <strong>{{ formatCurrency(section._milestone_totals?.allocated ?? 0) }}</strong>
                    </td>
                    <td></td>
                </tr>
            </template>
        </Draggable>
    </table>
</template>

<script setup lang="ts">
import Draggable from 'vuedraggable';
import Editor from 'primevue/editor';

import Btn from '../ui/Btn.vue';
import InlineEditCell from '../ui/InlineEditCell.vue';

import { useProposalStore } from '../store/proposalStore';
import { formatCurrency } from '../utils/helpers';
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

<style scoped>
.milestones-table {
    table-layout: fixed;
}

.col-handle { width: 28px; text-align: center; color: var(--text-3); }
.col-detail { width: auto; }
.col-currency { width: 140px; }
.col-actions { width: 60px; }

.drag-handle {
    cursor: grab;
    color: var(--text-3);
    user-select: none;
    font-size: 12px;
    line-height: 1;
}
.drag-handle:active { cursor: grabbing; }

.col-detail :deep(.iec) { margin-bottom: var(--s-3); }
.milestone-editor :deep(.p-editor-content) {
    border: 1px solid var(--border);
    border-radius: var(--r-md);
}

.row-totals td {
    background: var(--surface-50);
    border-top: 1px solid var(--border);
    font-weight: 500;
}
.col-label { text-align: right; color: var(--text-2); }
.amount-negative { color: var(--error); }

.empty-state {
    display: grid;
    place-content: center;
    text-align: center;
    padding: var(--s-7) 0;
}

.ghost {
    opacity: 0.4;
    background: var(--accent-bg);
}
</style>
