<template>

    <div>
        <Toast />

        <Card :key="section.id" :class="{ is_product: isProducts(section.type) }">

            <template #title>
                <div class="flex justify-between items-center cursor-auto">
                    <div class="flex gap-2 justify-between items-center">
                        <i v-if="['ONE_TIME'].includes(section.recurrance)" class="pi pi-receipt ml-1"></i>
                        <i v-if="['MONTHLY', 'ANNUAL'].includes(section.recurrance)" class="pi pi-sync ml-1"></i>
                        <span>{{ section.title }}</span>
                    </div>
                    <div class="flex gap-2 justify-between items-center relative">
                        <SplitButton v-if="isProducts(section.type)" label="Add Product" size="small" :model="sectionProductOptions" @click="() => proposalStore.addItemToSection(section.id, 'PRODUCT')" severity="contrast"></SplitButton>
                    </div>
                </div>
            </template>

            <template #content>

                <!-- Text Sections -->
                <Editor v-if="!isProducts(section.type)" v-model="section.description" editor-style="height: 500px"  class="cursor-auto" :modules="{ tootlbar: [] }" />

                <!-- Product Section - Products -->
                <table v-if="isProducts(section.type)" class="table-auto w-full border-collapse border border-gray-300 cursor-auto">
                    <thead class="bg-gray-100 text-left text-sm font-medium text-gray-700">
                    <tr>
                        <th class="p-2 border border-gray-300 text-center w-10"></th>
                        <th class="p-2 border border-gray-300">SKU</th>
                        <th class="p-2 border border-gray-300">Title</th>
                        <th class="p-2 border border-gray-300 text-right w-20">Qty</th>
                        <th class="p-2 border border-gray-300 text-right">Cost</th>
                        <th class="p-2 border border-gray-300 text-right">Price</th>
                        <th class="p-2 border border-gray-300 text-right">Margin</th>
                        <th class="p-2 border border-gray-300 text-right">Subtotal</th>
                    </tr>
                    </thead>
                    <Draggable tag="tbody" v-model="section.items" v-bind="dragOptions"  @start="drag = true" @end="drag = false" handle=".handle" item-key="id" >
                        <template #item="{ element: item }">
                            <tr class="hover:bg-gray-50 odd:bg-white even:bg-gray-50 transition ease-in-out delay-150">

                                <td class="product handle p-2 border border-gray-300 text-center cursor-move text-gray-500 w-10" :class="{ 'bg-gray-200': isComment(item) }" title="Drag to reorder">
                                    <span class="inline-block handle">⋮⋮</span>
                                </td>
                                <td v-if="!isComment(item)" class="product sku p-2 border border-gray-300">
                                    <InputText v-model="item.sku" size="small" fluid />
                                </td>
                                <td v-if="!isComment(item)" class="product title p-2 border border-gray-300">
                                    <InputText v-model="item.title" inputClass="w-full title" size="small" fluid />
                                    <Editor placeholder="Description..." v-model="item.description" class="mt-2 description" editorStyle="height: 150px" :modules="{ tootlbar: [] }" />
                                </td>
                                <td v-if="!isComment(item)" class="product qty p-2 border border-gray-300 text-right">
                                    <InputNumber @value-change="proposalStore.recalculateSectionItem(item.id, 'QTY')" v-model="item.qty" inputClass="text-right" size="small" fluid />
                                </td>
                                <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                                    <InputNumber @value-change="proposalStore.recalculateSectionItem(item.id, 'COST')" v-model="item.cost" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                                </td>
                                <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                                    <InputNumber @value-change="proposalStore.recalculateSectionItem(item.id, 'PRICE')" v-model="item.price" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                                </td>
                                <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                                    <InputNumber @value-change="proposalStore.recalculateSectionItem(item.id, 'MARGIN')" v-model="item.margin" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                                </td>
                                <td v-if="!isComment(item)" class="product currency p-2 border border-gray-300 text-right">
                                    <InputNumber @value-change="proposalStore.recalculateSectionItem(item.id, 'SUB_TOTAL')" v-model="item.subtotal" inputClass="text-right w-fit" size="small" mode="currency" currency="USD" locale="en-US" fluid />
                                </td>

                                <td v-if="isComment(item)" class="product-comment p-2 border border-gray-300 bg-gray-200 text-left" colspan="7">
                                    <Editor placeholder="Description..." v-model="item.description" />
                                </td>
                            </tr>
                        </template>
                    </Draggable>
                </table>

                <!-- Product Subtotal - Products -->
                <table v-if="isProducts(section.type)" class="table-auto w-full border-collapse border bg-gray-200">
                    <tbody>
                        <tr>
                            <td class="p-2 pr-3 text-right w-25 font-semibold cursor-auto">
                                {{ Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(section.items.reduce((a, c) => a + (c.price * c.qty), 0)) }}
                            </td>
                        </tr>
                    </tbody>
                </table>

            </template>
        </Card>
        <div v-if="['PRODUCTS', 'INFO'].includes(section.type)" class="add-section-container mt-4 w-full flex justify-center items-center">
            <a class="add-section bg-white cursor-pointer border border-gray-300 rounded-xl">
                <span class="pi pi-plus" style="font-size: 0.7em;"></span>
            </a>
        </div>
    </div>

</template>

<script setup>
    /* eslint-disable vue/no-use-v-if-with-v-for */
    import { onMounted, ref } from 'vue';
    import Draggable from "vuedraggable";
    import { useToast } from 'primevue/usetoast';

    import { useProposalStore } from '../store/proposalStore';

    import Toast from 'primevue/toast';
    import Button from 'primevue/button';
    import Card from 'primevue/card';
    import InputNumber from 'primevue/inputnumber';
    import InputText from 'primevue/inputtext';
    import Textarea from 'primevue/textarea';
    import OrderList from 'primevue/orderlist';
    import DataTable from 'primevue/datatable';
    import Column from 'primevue/column';
    import Editor from 'primevue/editor';
    import SplitButton from 'primevue/splitbutton';

    const toast = useToast();
    
    const proposalStore = useProposalStore();

    const { data : section } = defineProps(['data'])
    const targetRow = ref(null);

    const sectionProductOptions = [
        {
            label: 'Add Comment',
            command: () => {
                proposalStore.addItemToSection(section.id, 'COMMENT')
                toast.add({ severity: 'success', summary: 'Updated', detail: 'Data Updated', life: 3000 });
            }
        },
        {
            label: 'Duplicate',
            command: () => {
                toast.add({ severity: 'warn', summary: 'Delete', detail: 'Data Deleted', life: 3000 });
            }
        },
        {
            separator: true
        },
        {
            label: 'Delete',
            command: () => {
                toast.add({ severity: 'warn', summary: 'Delete', detail: 'Data Deleted', life: 3000 });
            }
        }
    ]

    const dragOptions = {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
    };

    function isProducts(e_type) {
        return e_type === 'PRODUCTS'
    };

    function isComment(item) {
        return item.type === 'COMMENT'
    };

    function handleReorder(e, sectionId) {
        return proposalStore.saveSectionsItems(sectionId, e.value)
    };

    function setEditRow(item) {
        targetRow.value = item.id;
    };

    onMounted(() => {
        if (section.items) {
            for (let i = 0; i < section.items.length; i++) {
                const item = section.items[i];
                if (!item.margin) {
                    item.margin = item.price - item.cost;
                }

                if (!item.subtotal) {
                    item.subtotal = item.price * item.qty;
                }
            }
        }
    });
</script>

<style>
    .add-section-container {
        height: 10px;
        opacity: 0.25;
    }

    .add-section-container:hover {
        opacity: 1;
        transition: all 500ms;
    }

    .add-section {
        position: relative;
        height: 25px;
        width: 25px;
        text-align: center;
        background-color: black;
    }

    .add-section span {
        color: white;
        position: absolute;
        top: 6px;
        left: 5.5px;
    }

    /* Prime Vue */
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
        background: #e5e7eb !important;;
    }

    /* Product Styling */
    .product {
        vertical-align: top;
    }

    .product.handle {
        max-width: 12px;
    }

    .product.sku {
        width: 150px;
        max-width: 200px;
    }

    .product.title {
        max-width: auto;
    }

    .product.qty {
        max-width: 40px;
    }

    .product.currency {
        width: 150px;
    }

    .product-comment textarea {
        height: fit-content;
    }
    
    /* Vue Draggable */
    .reorder {
        width: 15px;
        padding-right: 4px !important;
    }

    .flip-list-move {
        transition: transform 1s;
    }

    .no-move {
        transition: transform 0s;
    }

    .ghost {
        opacity: 0.5;
        background: #c8ebfb;
    }
</style>