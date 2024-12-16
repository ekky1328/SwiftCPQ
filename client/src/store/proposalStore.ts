import { defineStore } from 'pinia';
import { ref } from 'vue';
import { default_item_comment, default_item_product } from '../templates/products';

interface Proposal {
    id: number;
    sections: Section[];
}

interface Section {
    id: number;
    items: Item[];
}

interface Item {
    id: number;
    order: number;
    // other properties depending on your structure
}

export const useProposalStore = defineStore('proposal', () => {
    const data = ref<Proposal | null>(null);

    function saveSectionsItems(sectionId: number, items: Item[]) {
        if (data.value) {
            data.value.sections = data.value.sections.map((s) => {
                if (s.id === sectionId) s.items = items;
                return s;
            });
        }
    }

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

        const newId = section.items.length > 0 ? Math.max(...section.items.map((item) => item.id)) + 1 : 1;
        let newItemToAdd = itemType === 'PRODUCT' ? { ...default_item_product } :
                           itemType === 'COMMENT' ? { ...default_item_comment } :
                           null;

        if (!newItemToAdd) {
            throw new Error(`Invalid item type: ${itemType}`);
        }

        const itemToAdd: Item = {
            // @ts-ignore
            id: newId,
            ...newItemToAdd,
            order: section.items.length + 1,
        };

        section.items.push(itemToAdd);

        return;
    }

    function recalculateSectionItem(itemId: number, fieldUpdated: string) {
        if (!data.value) {
            throw new Error('Data is not initialized.');
        }
    
        const section = data.value.sections.find((sec) => 
            sec.items && sec.items.some((item) => item.id === itemId)
        );
    
        if (!section) {
            throw new Error(`Item with id ${itemId} not found in any section.`);
        }
    
        const itemIndex = section.items.findIndex((item) => item.id === itemId);
        const item = { ...section.items[itemIndex] } as any;
    
        if (!item) {
            throw new Error(`Item with id ${itemId} not found.`);
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
    
        data.value.sections = [...data.value.sections];
    }
     

    return {
        data,
        saveSectionsItems,
        addItemToSection,
        recalculateSectionItem
    };
});
