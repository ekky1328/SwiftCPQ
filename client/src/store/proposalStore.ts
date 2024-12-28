import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import _ from 'lodash';
import { DEFAULT_ITEM_COMMENT, DEFAULT_ITEM_PRODUCT } from '../constants/products';
import { DEFAULT_INFO_SECTION, DEFAULT_PRODUCT_SECTION } from '../constants/sections';

export interface Proposal {
    id: number
    identifier: string
    version: number
    title: string
    description: string
    customer: {
      name: string
    }
    sections: Section[],
    _totals: Record<string, { total: number; margin: number, cost: number }>;
}

export interface Section {
    id: number
    title: string
    type: string
    order: number
    recurrance?: string | null
    description?: string
    isOptional: boolean
    isReference: boolean
    isLocked: boolean
    __block_removal: boolean
    items?: Item[];
}

export interface Item {
    id: number
    sku?: string | null
    title: string
    description: string
    order: number
    qty: number
    cost: number
    price: number
    margin: number
    subtotal: number
    type: string
    isOptional: boolean
}

export const useProposalStore = defineStore('proposal', () => {
    const data = ref<Proposal | null>(null);
    const changeCount = ref<number>(0);
    const initData = ref<Proposal | null>(null);
    const isDraft = ref<boolean>(false);

    watch(data, (newData) => {
        if (initData.value === null) {
            resetDraftStatus();
        }

        if (newData) {
            if (_.isEqual(newData, initData.value)) {
                document.title = `${newData.identifier} - ${newData.title}`;
                isDraft.value = false;
            } else {
                document.title = `(Draft) ${newData.identifier} - ${newData.title}`;
                isDraft.value = true;
            }
        }

        changeCount.value += 1;
    }, { deep: true });


     // ------------------------------
     //        Proposal Functions
     // ------------------------------

    /**
     * Create a snapshot of the current data to compare against later.
     * - This is used to determine if the proposal has been modified, and is now a draft.
     */
    function resetDraftStatus() {
        initData.value = _.cloneDeep(data.value);
        isDraft.value = false;
        changeCount.value = 0;
    }

    /**
     * Recalculate the totals for each section in the proposal.
     * - This is used to update the totals when an item is added, removed, or updated.
     * - This function should be called after any changes to the proposal data.
     */
    function recalculateTotals() {
        if (data.value && data.value.sections) {
            const scaleFactor = 1000;
            const totals: Record<string, { total: number; margin: number; cost: number }> = {};

            data.value.sections.forEach(section => {
                if (!section.isOptional && !section.isReference && section.recurrance) {
                    if (!totals[section.recurrance]) {
                        totals[section.recurrance] = { total: 0, margin: 0, cost: 0 };
                    }

                    const sectionTotals = section.items?.reduce(
                        (acc, item) => {
                            if (!item.isOptional) {
                                acc.total += Math.round(item.subtotal * scaleFactor);
                                acc.margin += Math.round(item.margin * scaleFactor);
                                acc.cost += Math.round(item.cost * scaleFactor);
                            }
                            return acc;
                        },
                        { total: 0, margin: 0, cost: 0 }
                    ) || { total: 0, margin: 0, cost: 0 };

                    totals[section.recurrance].total += sectionTotals.total;
                    totals[section.recurrance].margin += sectionTotals.margin;
                    totals[section.recurrance].cost += sectionTotals.cost;
                }
            });

            data.value._totals = Object.fromEntries(
                Object.entries(totals).map(([key, value]) => [key, { total: value.total / scaleFactor, margin: value.margin / scaleFactor, cost: value.cost / scaleFactor }])
            ) as Record<string, { total: number; margin: number; cost: number }>;
        }
    }    


     // ------------------------------
     //        Section Functions
     // ------------------------------

    /**
     * Adds a new section to the proposal.
     * - This uses the sectionId to determine where to insert the new section.
     * - The sectionType is used to determine which template to use for the new section.
     * @param sectionId 
     * @param sectionType 
     * @returns 
     */
    function addSectionToProposal(sectionId: number, sectionType: string) {

        if (!data.value) {
            throw new Error('Data is not initialized.');
        }
    
        let sections = data.value.sections;
        let sectionIndex = sections.findIndex(sec => sec.id === sectionId);
        if (sectionIndex < 0 || sectionIndex >= sections.length) {
            throw new Error(`Section with index '${sectionIndex}' not found.`);
        }
    
        let template = null as any;
        switch (sectionType) {
            case 'PRODUCT':
                template = { ...DEFAULT_PRODUCT_SECTION }; // Clone the product template
                break;
            case 'INFO':
                template = { ...DEFAULT_INFO_SECTION }; // Clone the info template
                break;
            default:
                throw new Error(`Invalid section type: '${sectionType}'. Allowed values are 'PRODUCT' or 'INFO'.`);
        }
    
        template.id = sections.length > 0 ? Math.max(...sections.map((s: any) => s.id)) + 1 : 1;

        sections = sections.splice(sectionIndex + 1, 0, template)
        
        sections.forEach((section: any, index: number) => {
            section.order = index + 1;
        });
    
        return;
    }    

    /**
     * Duplicate a section in the proposal.
     * - This will create a copy of the section and insert it after the original section.
     * - The new section will have the same title as the original, with '(Copy)' appended.
     * - The new section will have a new ID and order.
     * @param section 
     * @returns 
     */
    function duplicateSection(section: Section) {
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }
    
        let sections = data.value.sections as Section[];
        if (sections.length === 0) {
            throw new Error(`Proposal had no sections to duplicate, how did you even do this?`);
        }

        let sectionIndex = data.value.sections.findIndex(sec => sec.id === section.id);
        if (!sectionIndex) {
            throw new Error(`Section to duplicate did not exist, how did you even do this?`);
        }

        const clonedSection = _.cloneDeep(section);

        clonedSection.id = sections.length;
        clonedSection.title = `${section.title} (Copy)`

        sections = sections.splice(sectionIndex + 1, 0, clonedSection)
        
        sections.forEach((section: any, index: number) => {
            section.order = index + 1;
        });

        return;
    }

    /**
     * Deletes a section from the proposal.
     * - This will remove the section with the specified sectionId.
     * @param sectionId 
     * @returns 
     */
    function deleteSection(sectionId: number) {
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }
    
        let sections = data.value.sections;
        let sectionIndex = sections.findIndex(sec => sec.id === sectionId);
        if (sectionIndex < 0 || sectionIndex >= sections.length) {
            throw new Error(`Section with index '${sectionIndex}' not found.`);
        }

        data.value.sections = data.value.sections.filter( sec => sec.id !== sectionId);

        return;
    }


     // ------------------------------
     //        Item Functions
     // ------------------------------

    /**
     * Adds a new item to a section in the proposal.
     * - This uses the sectionId to determine which section to add the item to.
     * - The itemType is used to determine which template to use for the new item.
     * @param sectionId 
     * @param itemType 
     * @returns 
     */
    function addItemToSection(sectionId: number, itemType: string) {
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }

        const section = data.value.sections.find((sec) => sec.id === sectionId);
        if (!section) {
            throw new Error(`Section with id ${sectionId} not found.`);
        }

        if (!Array.isArray(section.items)) {
            throw new Error(`Section with id ${sectionId} does not support items.`);
        }

        let newItemToAdd = itemType === 'PRODUCT' ? { ...DEFAULT_ITEM_PRODUCT } :
                           itemType === 'COMMENT' ? { ...DEFAULT_ITEM_COMMENT } :
                           null;

        if (!newItemToAdd) {
            throw new Error(`Invalid item type: ${itemType}`);
        }

        newItemToAdd.id = section.items.length as unknown as number;

        const itemToAdd: Item = {
            ...newItemToAdd,
            id: section.items.length,
            order: section.items.length + 1,
        } as Item;

        section.items.push(itemToAdd);

        return;
    }

    /**
     * Duplicates an item in a section of the proposal.
     * - This will create a copy of the item and insert it after the original item.
     * - The new item will have the same title as the original, with '(Copy)' appended.
     * - The new item will have a new ID and order.
     * @param sectionId 
     * @param item 
     * @returns 
     */
    function duplicateItem(sectionId: number, item: Item) {
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }
    
        const section = data.value.sections.find((sec: Section) => sec.id === sectionId);
        if (!section) {
            throw new Error(`Section with ID ${sectionId} does not exist.`);
        }
    
        let items = section.items as Item[];
        if (items.length === 0) {
            throw new Error(`Section with ID ${sectionId} has no items to duplicate.`);
        }
    
        const itemIndex = items.findIndex((it) => it.id === item.id);
        if (itemIndex === -1) {
            throw new Error(`Item to duplicate did not exist in section ${sectionId}.`);
        }
    
        const clonedItem = _.cloneDeep(item);
    
        clonedItem.id = items.length;
        clonedItem.title = `${item.title} (Copy)`;
    
        items.splice(itemIndex + 1, 0, clonedItem);
    
        items.forEach((item: any, index: number) => {
            item.order = index + 1;
        });
    
        return;
    }

    /**
     * Deletes an item from a section in the proposal.
     * - This will remove the item with the specified itemId from the section with the specified sectionId.
     * - The order of the remaining items will be recalculated.
     * @param sectionId 
     * @param itemId 
     * @returns 
     */
    function deleteSectionItem(sectionId: number, itemId: number) {
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }

        const section = data.value.sections.find((sec) => sec.id === sectionId);
        if (!section) {
            throw new Error(`Section with id ${sectionId} not found.`);
        }

        if (!Array.isArray(section.items)) {
            throw new Error(`Section with id ${sectionId} does not support items.`);
        }

        section.items = section.items.filter( item => item.id !== itemId).map( (item, index) => {
            item.order = index;
            return item;
        })

        return;
    }

    /**
     * Recalculate the values for an item in a section.
     * - This will update the subtotal and margin for the item based on the field that was updated.
     * - The fieldUpdated parameter should be one of: 'QTY', 'PRICE', 'COST', 'SUB_TOTAL', 'MARGIN'.
     * - This function should be called after any changes to the item data.
     * @param sectionId 
     * @param itemId 
     * @param fieldUpdated 
     */
    function recalculateSectionItem(sectionId: number, itemId: number, fieldUpdated: string) {
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }
    
        let newData = _.cloneDeep(data.value);
    
        const section = newData.sections.find(sec => sec.id === sectionId);
        if (!section) {
            throw new Error(`Section with id ${sectionId} not found in proposal`);
        }
    
        if (!section.items) {
            throw new Error(`Section with id ${sectionId} had no items.`);
        }
    
        const itemIndex = section.items.findIndex((item) => item.id === itemId);
        const item = { ...section.items[itemIndex] } as any;
        if (!item) {
            throw new Error(`Item with id ${itemId} not found in section '${sectionId}'.`);
        }
    
        const scaleFactor = 1000;
    
        switch (fieldUpdated) {
            case 'QTY': {
                item.subtotal = Math.round(item.qty * item.price * scaleFactor) / scaleFactor;
                item.margin = Math.round((item.price - item.cost) * item.qty * scaleFactor) / scaleFactor;
                break;
            }
            case 'PRICE': {
                item.subtotal = Math.round(item.qty * item.price * scaleFactor) / scaleFactor;
                item.margin = Math.round((item.price - item.cost) * item.qty * scaleFactor) / scaleFactor;
                break;
            }
            case 'COST': {
                item.margin = Math.round((item.price - item.cost) * item.qty * scaleFactor) / scaleFactor;
                break;
            }
            case 'SUB_TOTAL': {
                if (item.qty !== 0) {
                    item.price = Math.round((Number(item.subtotal) * scaleFactor) / Number(item.qty)) / scaleFactor;
                    item.margin = Math.round((Number(item.price - item.cost) * Number(item.qty) * scaleFactor)) / scaleFactor;
                } else {
                    item.price = 0;
                    item.margin = 0;
                }
                break;
            }
            case 'MARGIN': {
                if (item.qty !== 0) {
                    item.price = Math.round((item.cost * scaleFactor + (item.margin * scaleFactor) / item.qty)) / scaleFactor;
                    item.subtotal = Math.round(item.qty * item.price * scaleFactor) / scaleFactor;
                } else {
                    item.price = item.cost;
                    item.subtotal = 0;
                }
                break;
            }
            default:
                throw new Error(`Invalid field updated: ${fieldUpdated}`);
        }
    
        section.items = [
            ...section.items.slice(0, itemIndex),
            item,
            ...section.items.slice(itemIndex + 1),
        ];
    
        data.value = newData;
    
        recalculateTotals();
    }
     
    return {
        // State
        data,
        isDraft,
        changeCount,

        // Proposal Functions
        resetDraftStatus,
        recalculateTotals,

        // Section Functions
        addSectionToProposal,
        duplicateSection,
        deleteSection,
        
        // Item Functions
        addItemToSection,
        duplicateItem,
        deleteSectionItem,
        recalculateSectionItem
    };
});
