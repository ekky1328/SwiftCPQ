
export const PRODUCT_TYPES = {
    PRODUCT: 'PRODUCT',
    COMMENT: 'COMMENT'
}

export const DEFAULT_ITEM_PRODUCT  = {
    id: null,
    title: "",
    description: "",
    order: null,
    qty: 0,
    cost: 0,
    price: 0,
    margin: 0,
    subtotal: 0,
    sku: "",
    type: PRODUCT_TYPES.PRODUCT,
    isOptional: false
};

export const DEFAULT_ITEM_COMMENT = {
    id: null,
    title: "",
    description: "",
    order: null,
    qty: 0,
    cost: 0,
    price: 0,
    margin: 0,
    subtotal: 0,
    sku: null,
    type: PRODUCT_TYPES.COMMENT,
    isOptional: true
};