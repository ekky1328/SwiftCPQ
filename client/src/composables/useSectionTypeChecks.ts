import { SECTION_TYPES } from '../constants/sections';
import { PRODUCT_TYPES } from '../constants/products';
import type { Item, Section } from '../types/Proposal';

export function isTableContent(type: string): boolean {
    return type === SECTION_TYPES.PRODUCTS || type === SECTION_TYPES.MILESTONES;
}

export function isInfo(type: string): boolean {
    return [SECTION_TYPES.INFO, SECTION_TYPES.COVER_LETTER, SECTION_TYPES.TERMS_AND_CONDITIONS].includes(type);
}

export function isProducts(type: string): boolean {
    return type === SECTION_TYPES.PRODUCTS;
}

export function isTotals(type: string): boolean {
    return type === SECTION_TYPES.TOTALS;
}

export function isMilestones(type: string): boolean {
    return type === SECTION_TYPES.MILESTONES;
}

export function isComment(item: Item): boolean {
    return item.type === PRODUCT_TYPES.COMMENT;
}

export function createSectionId(section: Section): string {
    return [SECTION_TYPES.COVER_LETTER, SECTION_TYPES.TERMS_AND_CONDITIONS].includes(section.type)
        ? `${section.type.toLowerCase()}`
        : `section_${section.id}`;
}
