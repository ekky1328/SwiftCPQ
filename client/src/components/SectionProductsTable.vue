<template>
    <table class="swift-table products-table">
        <thead>
            <tr>
                <th class="col-handle"></th>
                <th class="col-sku">SKU</th>
                <th class="col-title">Title</th>
                <th class="col-num col-qty">Qty</th>
                <th class="col-currency">Cost</th>
                <th class="col-currency">Price</th>
                <th class="col-currency">Margin</th>
                <th class="col-currency">Subtotal</th>
                <th class="col-actions"></th>
            </tr>
        </thead>
        <Draggable
            tag="tbody"
            v-model="section.items"
            v-bind="dragOptions"
            handle=".drag-handle"
            item-key="id"
            :animation="200"
        >
            <template #item="{ element: item }">
                <template v-if="isComment(item)">
                    <tr class="row-comment">
                        <td class="col-handle">
                            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                        </td>
                        <td colspan="7" class="comment-cell">
                            <Editor
                                placeholder="Comment..."
                                v-model="item.description"
                                class="comment-editor"
                            />
                        </td>
                        <td class="col-actions">
                            <div class="row-actions">
                                <Btn variant="ghost" icon="duplicate" title="Duplicate" @click="proposalStore.duplicateItem(section.id, item)" />
                                <Btn variant="ghost" icon="trash" title="Delete" @click="proposalStore.deleteSectionItem(section.id, item.id)" />
                            </div>
                        </td>
                    </tr>
                </template>

                <template v-else>
                    <tr class="row-product">
                        <td class="col-handle">
                            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                        </td>
                        <td class="col-sku">
                            <InlineEditCell
                                type="text"
                                :model-value="item.sku"
                                @commit="(v) => { item.sku = String(v); }"
                            />
                        </td>
                        <td class="col-title">
                            <div class="title-row">
                                <InlineEditCell
                                    type="text"
                                    :model-value="item.title"
                                    @commit="(v) => { item.title = String(v); }"
                                />
                                <button
                                    class="desc-toggle"
                                    :class="{ 'desc-toggle--open': isDescOpen(item.id) }"
                                    :title="isDescOpen(item.id) ? 'Hide description' : 'Edit description'"
                                    @click="toggleDesc(item.id)"
                                >›</button>
                            </div>
                        </td>
                        <td class="col-num col-qty">
                            <InlineEditCell
                                type="qty"
                                :model-value="item.qty"
                                @commit="(v) => { item.qty = Number(v); proposalStore.recalculateSectionItem(section.id, item.id, 'QTY'); }"
                            />
                        </td>
                        <td class="col-currency">
                            <InlineEditCell
                                type="cost"
                                :model-value="item.cost"
                                @commit="(v) => { item.cost = Number(v); proposalStore.recalculateSectionItem(section.id, item.id, 'COST'); }"
                            />
                        </td>
                        <td class="col-currency">
                            <InlineEditCell
                                type="price"
                                :model-value="item.price"
                                @commit="(v) => { item.price = Number(v); proposalStore.recalculateSectionItem(section.id, item.id, 'PRICE'); }"
                            />
                        </td>
                        <td class="col-currency">
                            <InlineEditCell
                                type="price"
                                :model-value="item.margin"
                                @commit="(v) => { item.margin = Number(v); proposalStore.recalculateSectionItem(section.id, item.id, 'MARGIN'); }"
                            />
                        </td>
                        <td class="col-currency col-subtotal">
                            <InlineEditCell
                                type="price"
                                :model-value="item.subtotal"
                                @commit="(v) => { item.subtotal = Number(v); proposalStore.recalculateSectionItem(section.id, item.id, 'SUB_TOTAL'); }"
                            />
                        </td>
                        <td class="col-actions">
                            <div class="row-actions">
                                <Btn variant="ghost" icon="duplicate" title="Duplicate" @click="proposalStore.duplicateItem(section.id, item)" />
                                <Btn variant="ghost" icon="trash" title="Delete" @click="proposalStore.deleteSectionItem(section.id, item.id)" />
                            </div>
                        </td>
                    </tr>
                    <tr v-if="isDescOpen(item.id)" class="row-description">
                        <td></td>
                        <td colspan="7" class="desc-cell">
                            <Editor
                                placeholder="Description..."
                                v-model="item.description"
                                editor-style="min-height: 120px; max-height: 500px; overflow-y: auto;"
                            />
                        </td>
                        <td></td>
                    </tr>
                </template>
            </template>

            <template #footer>
                <tr v-if="!section.items || section.items.length === 0" class="row-empty">
                    <td colspan="9">
                        <div class="empty-state">
                            <h3>No products</h3>
                            <div class="empty-actions">
                                <Btn variant="primary" @click="addItemToSection(section.id, PRODUCT_TYPES.PRODUCT)">Add Product</Btn>
                                <Btn variant="default" @click="addItemToSection(section.id, PRODUCT_TYPES.COMMENT)">Add Comment</Btn>
                                <Btn variant="default" icon="db" @click="openCataloguePicker(section.id)">From Catalogue</Btn>
                            </div>
                        </div>
                    </td>
                </tr>

                <tr v-if="section._totals" class="row-totals">
                    <td colspan="4"></td>
                    <td class="col-currency" v-tooltip.top="'Section Cost Total'">
                        {{ formatCurrency(section._totals.cost) }}
                    </td>
                    <td class="col-currency"></td>
                    <td class="col-currency" v-tooltip.top="'Section Margin Total'">
                        {{ formatCurrency(section._totals.margin) }}
                    </td>
                    <td class="col-currency col-subtotal" v-tooltip.top="'Section Subtotal'">
                        <strong>{{ formatCurrency(section._totals.total) }}</strong>
                    </td>
                    <td></td>
                </tr>
            </template>
        </Draggable>
    </table>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-use-v-if-with-v-for */
import { onMounted, reactive } from 'vue';
import Draggable from 'vuedraggable';
import { useToast } from 'primevue/usetoast';
import Editor from 'primevue/editor';

import Btn from '../ui/Btn.vue';
import InlineEditCell from '../ui/InlineEditCell.vue';

import { useProposalStore } from '../store/proposalStore';
import { PRODUCT_TYPES } from '../constants/products';
import { isComment } from '../composables/useSectionTypeChecks';
import { formatCurrency } from '../utils/helpers';
import type { Section } from '../types/Proposal';

const props = defineProps<{
    section: Section;
    openCataloguePicker: (sectionId: number) => void;
}>();

const toast = useToast();
const proposalStore = useProposalStore();

const dragOptions = {
    animation: 200,
    group: 'description',
    disabled: false,
    ghostClass: 'ghost',
};

const descOpen = reactive<Record<number, boolean>>({});
function isDescOpen(id: number) {
    return !!descOpen[id];
}
function toggleDesc(id: number) {
    descOpen[id] = !descOpen[id];
}

function addItemToSection(sectionId: number, itemType: string) {
    proposalStore.addItemToSection(sectionId, itemType);
    if (itemType === PRODUCT_TYPES.PRODUCT) {
        toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added product to section', life: 3000 });
    } else if (itemType === PRODUCT_TYPES.COMMENT) {
        toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added comment to section', life: 3000 });
    }
}

onMounted(() => {
    if (props.section.items) {
        for (const item of props.section.items) {
            if (!item.margin) item.margin = item.price - item.cost;
            if (!item.subtotal) item.subtotal = item.price * item.qty;
        }
    }
});
</script>

<style scoped>
.products-table {
    table-layout: fixed;
}

.col-handle { width: 28px; text-align: center; color: var(--text-3); }
.col-sku { width: 140px; }
.col-title { width: auto; }
.col-qty { width: 70px; }
.col-currency { width: 110px; }
.col-actions { width: 60px; }

.drag-handle {
    cursor: grab;
    color: var(--text-3);
    user-select: none;
    font-size: 12px;
    line-height: 1;
}
.drag-handle:active { cursor: grabbing; }

.title-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
}
.title-row > .iec { flex: 1; min-width: 0; }

.desc-toggle {
    width: 18px;
    height: 18px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
    background: var(--surface-50);
    color: var(--text-3);
    font-size: 14px;
    line-height: 1;
    padding: 0 0 1px 0;
    cursor: pointer;
    transition: transform 120ms ease, color 120ms ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.desc-toggle:hover { color: var(--text-1); border-color: var(--text-3); }
.desc-toggle--open { transform: rotate(90deg); color: var(--accent); border-color: var(--accent); }

.row-comment > td:not(.col-handle) {
    background: var(--accent-bg);
}
.row-comment > .comment-cell {
    border-left: 2px solid var(--accent);
    padding: var(--s-3) var(--s-5);
}
.row-comment :deep(.comment-editor),
.row-comment :deep(.comment-editor .p-editor-container) {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
}
.row-comment :deep(.comment-editor .p-editor-toolbar) {
    display: none;
}
.row-comment :deep(.comment-editor .p-editor-content),
.row-comment :deep(.comment-editor .ql-container) {
    background: transparent !important;
    border: none !important;
    min-height: unset !important;
}
.row-comment :deep(.comment-editor .ql-editor) {
    padding: 4px 0 !important;
    background: transparent !important;
    color: var(--text-1);
}

.row-description > .desc-cell {
    background: var(--surface-100);
    padding: var(--s-3) var(--s-5);
}
.row-description :deep(.p-editor-content) {
    border: 1px solid var(--border);
    border-radius: var(--r-md);
}

.row-totals td {
    background: var(--surface-50);
    border-top: 1px solid var(--border);
    font-weight: 500;
}

.empty-state {
    display: grid;
    place-content: center;
    text-align: center;
    padding: var(--s-7) 0;
    gap: var(--s-4);
}
.empty-actions {
    display: flex;
    gap: var(--s-3);
    justify-content: center;
}

.ghost {
    opacity: 0.4;
    background: var(--accent-bg);
}
</style>
