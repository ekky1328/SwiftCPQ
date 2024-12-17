<template>

    <div>
        <Toast position="top-center" />

        <Card :key="section.id" :class="{ is_product: isProducts(section.type) }">

            <template #title>
                <div class="flex justify-between items-center cursor-auto">
                    <div class="section-header-left">
                        <span v-if="!['INFO', 'PRODUCTS'].includes(section.type)">{{ section.title }}</span>
                        <InputText v-if="['INFO', 'PRODUCTS'].includes(section.type)" placeholder="Section Title" class="section-title !px-1 hover:!border-black focus:!border-black" v-model="section.title" size="small" fluid />
                    </div>
                    <div class="section-header-right flex gap-2 justify-between items-center relative">
                        <SplitButton v-if="['INFO', 'PRODUCTS'].includes(section.type)" label="" icon="pi pi-cog" size="small" :model="sectionProductOptions(section)" @click="() => console.log('Opened Section Settings')" severity="contrast"></SplitButton>
                    </div>
                </div>
            </template>

            <template #content>

                <!-- Text Sections -->
                <Editor v-if="!isProducts(section.type)" v-model="section.description" editor-style="height: 500px"  class="cursor-auto" />

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
                            <tr class="product-row hover:bg-gray-50 odd:bg-white even:bg-gray-50 transition ease-in-out delay-150 relative">

                                <td class="product handle p-2 border border-gray-300 text-center cursor-move text-gray-500 w-10" :class="{ 'bg-gray-200': isComment(item) }" title="Drag to reorder">
                                    <span class="inline-block handle">⋮⋮</span>
                                    <div class="product-shortcuts" title="">
                                        <span class="product-shortcut delete pi pi-trash" title="Delete item" @click="proposalStore.deleteSectionItem(section.id, item.id)"></span>
                                        <span class="product-shortcut pi pi-clone" title="Duplicate item" @click="proposalStore.duplicateItem(section.id, item)"></span>
                                    </div>
                                </td>
                                <td v-if="!isComment(item)" class="product sku p-2 border border-gray-300">
                                    <InputText placeholder="Product SKU" v-model="item.sku" size="small" fluid />
                                </td>
                                <td v-if="!isComment(item)" class="product title p-2 border border-gray-300">
                                    <InputText placeholder="Product Title" v-model="item.title" inputClass="w-full title" size="small" fluid />
                                    <Editor placeholder="Description..." v-model="item.description" class="mt-2 description" editorStyle="height: 150px" />
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

                                <td v-if="isComment(item)" class="product-comment px-2 border border-gray-300 bg-gray-200 text-left" colspan="7">
                                    <Editor placeholder="Description..." v-model="item.description" />
                                </td>
                            </tr>
                        </template>
                    </Draggable>
                </table>

                <div v-if="section.items && section.items.length === 0" class="grid place-content-center p-24">
                    <h3>No products...</h3>
                </div>

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

        <div v-if="['PRODUCTS', 'INFO'].includes(section.type)" class="add-section-container mt-4 w-full flex justify-center items-center relative">
            <SpeedDial :model="proposalSectionOptions(section.id)" direction="right" :style="{ position: 'absolute', top: '-15px' }" />
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
    import SpeedDial from 'primevue/speeddial';
    import SplitButton from 'primevue/splitbutton';

    const toast = useToast();
    
    const proposalStore = useProposalStore();

    const { data : section } = defineProps(['data'])
    const targetRow = ref(null);

    const proposalSectionOptions = (sectionId) => [
        {
            label: 'Products',
            icon: 'pi pi-box',
            command: () => {
                proposalStore.addSectionToProposal(sectionId, 'PRODUCT', 'AFTER');
                toast.add({ severity: 'info', summary: 'Added Section', detail: 'Added new products section to proposal', life: 3000 });
            }
        },
        {
            label: 'Info',
            icon: 'pi pi-pen-to-square',
            command: () => {
                proposalStore.addSectionToProposal(sectionId, 'INFO', 'AFTER');
                toast.add({ severity: 'info', summary: 'Added Section', detail: 'Added new info section to proposal', life: 3000 });
            }
        }
    ]

    const sectionProductOptions = (section) => {

        let options = [];
        if (section.type === 'PRODUCTS') {
            const product_options = [
                {
                    label: 'Add Product',
                    command: () => {
                        proposalStore.addItemToSection(section.id, 'PRODUCT');
                        toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added product to section', life: 3000 });
                    }
                },{
                    label: 'Add Comment',
                    command: () => {
                        proposalStore.addItemToSection(section.id, 'COMMENT');
                        toast.add({ severity: 'success', summary: 'Added Item', detail: 'Added comment to section', life: 3000 });
                    }
                }
            ];

            options = [ ...options, ...product_options ];  
        }


        let default_options = [{
                label: 'Duplicate',
                command: () => {
                    proposalStore.duplicateSection(section);
                    toast.add({ severity: 'success', summary: 'Duplicated Section', detail: 'Section has been duplicated', life: 3000 });
                }
            },
            {
                separator: true
            },
            {
                label: 'Delete',
                command: () => {
                    proposalStore.deleteSection(section.id);
                    toast.add({ severity: 'error', summary: 'Deleted Section', detail: 'Section has been deleted', life: 5000 });
                }
        }];

        options = [ ...options, ...default_options]; 

        return options;
    }

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
        background-color: #cdcdcd;
        border-color: #cdcdcd;
        box-shadow: none;
    }

    .section-header-left input.section-title:focus {
        font-size: 20px;
        padding: 0;
        background-color: #ffffff;
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

    .add-section-container .p-speeddial-open .p-speeddial-list {
        transition: all 200ms;
        background: white;
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

    .product-row .product-shortcuts {
        visibility: hidden;

        cursor: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: absolute;
        top: 0;
        padding-left: 8px !important;
        right: -40px;
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