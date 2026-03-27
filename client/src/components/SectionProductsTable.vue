<template>
    <table class="table-auto w-full border-collapse border border-gray-300 cursor-auto">
        <thead class="bg-gray-100 text-left text-sm font-medium text-gray-700">
            <tr>
                <th class="p-2 border border-gray-300 text-center w-10"></th>
                <th class="p-2 border border-gray-300">SKU</th>
                <th class="p-2 border border-gray-300">Title</th>
                <th class="p-2 product qty border border-gray-300 text-right w-20">Qty</th>
                <th class="p-2 product currency border border-gray-300 text-right">Cost</th>
                <th class="p-2 product currency border border-gray-300 text-right">Price</th>
                <th class="p-2 product currency border border-gray-300 text-right">Margin</th>
                <th class="p-2 product currency border border-gray-300 text-right">Subtotal</th>
            </tr>
        </thead>
        <Draggable
            tag="tbody"
            v-model="section.items"
            v-bind="dragOptions"
            handle=".handle"
            item-key="id"
            :animation="200"
        >
            <template #item="{ element: item }">
                <tr class="product-row hover:bg-gray-50 odd:bg-white even:bg-gray-50 transition ease-in-out delay-150 relative">

                    <td colspan="1" class="product p-2 border border-gray-300 text-center text-gray-500 w-10" :class="{ 'bg-gray-200': isComment(item) }" title="Drag to reorder">
                        <span class="inline-block handle cursor-move">⋮⋮</span>
                        <div class="product-shortcuts">
                            <span class="product-shortcut delete pi pi-trash" title="Delete item" @click="proposalStore.deleteSectionItem(section.id, item.id)"></span>
                            <span class="product-shortcut pi pi-clone" title="Duplicate item" @click="proposalStore.duplicateItem(section.id, item)"></span>
                        </div>
                    </td>
                    <td v-if="!isComment(item)" class="product sku p-2 border border-gray-300">
                        <InputText placeholder="Product SKU" v-model="item.sku" size="small" fluid />
                    </td>
                    <td v-if="!isComment(item)" class="product title p-2 border border-gray-300">
                        <InputText placeholder="Product Title" v-model="item.title" inputClass="w-full title" size="small" fluid />

                        <Inplace :active="item.description.trim() !== ''">
                            <template #display>
                                <a>Edit Description</a>
                            </template>
                            <template #content="{ closeCallback }">
                                <Editor placeholder="Description..." v-model="item.description" class="mt-2 description" editor-style="max-height: 500px; overflow-y: auto;" />
                                <a class="description-close" @click="closeCallback">Close Description</a>
                            </template>
                        </Inplace>
                    </td>
                    <td v-if="!isComment(item)" class="product qty p-2 border border-gray-300 text-right">
                        <InputNumber @value-change="proposalStore.recalculateSectionItem(section.id, item.id, 'QTY')" v-model="item.qty" inputClass="text-right" size="small" fluid />
                    </td>
                    <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                        <InputNumber @value-change="proposalStore.recalculateSectionItem(section.id, item.id, 'COST')" v-model="item.cost" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                    </td>
                    <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                        <InputNumber @value-change="proposalStore.recalculateSectionItem(section.id, item.id, 'PRICE')" v-model="item.price" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                    </td>
                    <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                        <InputNumber @value-change="proposalStore.recalculateSectionItem(section.id, item.id, 'MARGIN')" v-model="item.margin" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                    </td>
                    <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                        <InputNumber @value-change="proposalStore.recalculateSectionItem(section.id, item.id, 'SUB_TOTAL')" v-model="item.subtotal" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                    </td>

                    <td v-if="isComment(item)" class="product-comment border border-gray-300 bg-gray-200 text-left" colspan="7">
                        <Editor placeholder="Description..." v-model="item.description" />
                    </td>
                </tr>
            </template>
            <template #footer>
                <tr v-if="section.items && section.items.length === 0">
                    <td colspan="7">
                        <div class="grid place-content-center text-center py-12 w-full">
                            <h3>No products</h3>
                            <div class="flex gap-2 pt-2">
                                <Button label="Add Product" size="small" severity="contrast" @click="addItemToSection(section.id, PRODUCT_TYPES.PRODUCT)" />
                                <Button label="Add Comment" size="small" severity="contrast" @click="addItemToSection(section.id, PRODUCT_TYPES.COMMENT)" />
                                <Button label="Add from Catalogue" size="small" severity="secondary" icon="pi pi-database" @click="openCataloguePicker(section.id)" />
                            </div>
                        </div>
                    </td>
                </tr>

                <tr v-if="section._totals">
                    <td class="p-2 bg-gray-200" colspan="4"></td>
                    <td class="p-2 pr-3 text-right w-25 bg-gray-200" v-tooltip.top="'Section Cost Total'">
                        {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(section._totals.cost) }}
                    </td>
                    <td class="p-2 pr-3 text-right w-25 bg-gray-200"></td>
                    <td class="p-2 pr-3 text-right w-25 bg-gray-200" v-tooltip.top="'Section Margin Total'">
                        {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(section._totals.margin) }}
                    </td>
                    <td class="p-2 pr-3 text-right w-25 font-semibold bg-gray-200" v-tooltip.top="'Section Subtotal'">
                        {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(section._totals.total) }}
                    </td>
                </tr>
            </template>
        </Draggable>
    </table>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-use-v-if-with-v-for */
import { onMounted } from 'vue';
import Draggable from 'vuedraggable';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Editor from 'primevue/editor';
import Inplace from 'primevue/inplace';

import { useProposalStore } from '../store/proposalStore';
import { PRODUCT_TYPES } from '../constants/products';
import { isComment } from '../composables/useSectionTypeChecks';
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

onMounted(() => {
    if (props.section.items) {
        for (const item of props.section.items) {
            if (!item.margin) item.margin = item.price - item.cost;
            if (!item.subtotal) item.subtotal = item.price * item.qty;
        }
    }
});
</script>

<style>
/* Product Styling */
.product {
    vertical-align: top;
}

.product.handle { max-width: 12px; }
.product.sku { width: 150px; max-width: 200px; }
.product.qty { width: 75px; }
.product.currency { width: 125px; }
.product-comment textarea { height: fit-content; }

.product-row .product-shortcuts {
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

.product-shortcuts:hover,
.product-row:hover .product-shortcuts {
    visibility: visible;
}

.product-row .product-shortcut {
    padding: 8px;
    background: white;
    border: 2px solid #cdcdcd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 200ms;
}

.product-shortcuts .product-shortcut:hover {
    border-color: black;
    background-color: black;
    color: white;
}

.product-shortcuts .product-shortcut.delete:hover {
    border-color: rgb(143, 0, 0);
    background-color: rgb(143, 0, 0);
}

.product.title .description-close {
    opacity: 0.5;
    font-size: 12px;
    text-decoration: underline;
    background: white;
}

.product.title .description-close:hover { opacity: 1; }

/* PrimeVue overrides */
.product-comment .p-editor-toolbar.ql-toolbar,
.product .description .p-editor-toolbar.ql-toolbar {
    display: none !important;
}

.product .description .p-editor-content {
    border: 1px solid #cbd5e1 !important;
    border-radius: 6px !important;
    overflow: hidden;
}

.product-comment .ql-editor {
    background: #e5e7eb !important;
}

.product.title .p-inplace-content { position: relative; }

.product.title .p-inplace-display {
    opacity: 0.5;
    background: none;
    padding: 0;
    font-size: 12px;
    text-decoration: underline;
}

.product.title .p-inplace-display:hover { opacity: 1; }
</style>
