export const SECTION_TYPES = {
    PRODUCTS: 'PRODUCTS',
    INFO: 'INFO',
    TERMS_AND_CONDITIONS: 'TERMS_AND_CONDITIONS',
}

export const SECTION_RECURRANCE = {
    ONE_TIME: 'ONE_TIME',
    RECURRING: 'RECURRING',
    NONE: 'NONE',
}

export const DEFAULT_PRODUCT_SECTION = {
    id: null,
    title: "",
    type: SECTION_TYPES.PRODUCTS,
    order: null,
    recurrance: SECTION_RECURRANCE.ONE_TIME,
    description: null,
    isOptional: false,
    isLocked: false,
    items: []
}

export const DEFAULT_INFO_SECTION = {
    id: null,
    title: "",
    type: SECTION_TYPES.INFO,
    order: null,
    recurrance: null,
    description: "",
    isOptional: false,
    isLocked: true
}