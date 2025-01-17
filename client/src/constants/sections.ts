import { Section } from "../types/Proposal"

export const SECTION_TYPES = {
    COVER_LETTER: 'COVER_LETTER',
    PRODUCTS: 'PRODUCTS',
    INFO: 'INFO',
    TOTALS: 'TOTALS',
    MILESTONES: 'MILESTONES',
    TERMS_AND_CONDITIONS: 'TERMS_AND_CONDITIONS',
}

export const SECTION_RECURRANCE = {
    ONE_TIME: 'ONE_TIME',
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
};

export const DEFAULT_PRODUCT_SECTION = {
    id: 0,
    title: "",
    type: SECTION_TYPES.PRODUCTS,
    order: 0,
    recurrance: SECTION_RECURRANCE.ONE_TIME,
    description: "",
    isOptional: false,
    isReference: false,
    isLocked: false,
    blockRemoval: false,
    items: []
} as Section;

export const DEFAULT_INFO_SECTION = {
    id: 0,
    title: "",
    type: SECTION_TYPES.INFO,
    order: 0,
    recurrance: null,
    description: "",
    isOptional: false,
    isReference: false,
    isLocked: false,
    blockRemoval: false
} as Section;

