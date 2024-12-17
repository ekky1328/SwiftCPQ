import { defineStore } from 'pinia';
import { ref } from 'vue';
import _ from 'lodash';
import { DEFAULT_ITEM_COMMENT, DEFAULT_ITEM_PRODUCT } from '../constants/products';
import { DEFAULT_INFO_SECTION, DEFAULT_PRODUCT_SECTION } from '../constants/sections';

interface Proposal {
    id: number
    version: number
    title: string
    description: string
    customer: {
      name: string
    }
    sections: Section[]
}

interface Section {
    id: number
    title: string
    type: string
    order: number
    recurrance?: string
    description?: string
    isOptional: boolean
    isLocked: boolean
    items: Item[];
}

interface Item {
    id: number
    title: string
    description: string
    order: number
    qty: number
    cost: number
    price: number
    margin: number
    subtotal: number
    sku?: string
    type: string
    isOptional: boolean
}

export const useProposalStore = defineStore('proposal', () => {
    const data = ref<Proposal | null>(null);

    // Section Functions
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

        clonedSection.id = sections.length > 0 ? Math.max(...sections.map((s: any) => s.id)) + 1 : 1;
        clonedSection.title = `${section.title} (Copy)`

        sections = sections.splice(sectionIndex + 1, 0, clonedSection)
        
        sections.forEach((section: any, index: number) => {
            section.order = index + 1;
        });

        return;
    }

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

    
    // Item Functions
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

        const itemToAdd: Item = {
            // @ts-ignore
            id: section.items.length,
            ...newItemToAdd,
            order: section.items.length + 1,
        };

        section.items.push(itemToAdd);

        return;
    }

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
    
        clonedItem.id = items.length > 0 ? Math.max(...items.map((i: any) => i.id)) + 1 : 1;
        clonedItem.title = `${item.title} (Copy)`;
    
        items.splice(itemIndex + 1, 0, clonedItem);
    
        items.forEach((item: any, index: number) => {
            item.order = index + 1;
        });
    
        return;
    }

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

    function recalculateSectionItem(sectionId: number, itemId: number, fieldUpdated: string) {
        
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }
    
        let newData = _.cloneDeep(data.value);

        const section = newData.sections.find( sec => sec.id === sectionId);
        if (!section) {
            throw new Error(`Section with id ${itemId} not found in proposal`);
        }
    
        const itemIndex = section.items.findIndex((item) => item.id === itemId);
        const item = { ...section.items[itemIndex] } as any;
        if (!item) {
            throw new Error(`Item with id ${itemId} not found in section '${sectionId}'.`);
        }
    
        switch (fieldUpdated) {
            case 'QTY': {
                item.subtotal = item.qty * item.price;
                item.margin = (item.price - item.cost) * item.qty;
                break;
            }
            case 'PRICE': {
                item.subtotal = item.qty * item.price;
                item.margin = (item.price - item.cost) * item.qty;
                break;
            }
            case 'COST': {
                item.margin = (item.price - item.cost) * item.qty;
                break;
            }
            case 'SUB_TOTAL': {
                if (item.qty !== 0) {
                    item.price = Number(item.subtotal) / Number(item.qty);
                    item.margin = Number(item.price - item.cost) * Number(item.qty);
                } else {
                    item.price = 0;
                    item.margin = 0;
                }
                break;
            }
            case 'MARGIN': {
                if (item.qty !== 0) {
                    item.price = item.cost + item.margin / item.qty;
                    item.subtotal = item.qty * item.price;
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

    }
     
    return {
        data,

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
