import { Item } from "../types/Proposal";

export const PRODUCT_TYPES = {
    PRODUCT: 'PRODUCT',
    COMMENT: 'COMMENT'
}

export const DEFAULT_ITEM_PRODUCT  = {
    id: 0,
    sku: "",
    title: "",
    description: "",
    order: 0,
    qty: 0,
    cost: 0,
    price: 0,
    margin: 0,
    subtotal: 0,
    type: PRODUCT_TYPES.PRODUCT,
    isOptional: false
} as Item;

export const DEFAULT_ITEM_COMMENT = {
    id: 0,
    sku: null,
    title: "",
    description: "",
    order: 0,
    qty: 0,
    cost: 0,
    price: 0,
    margin: 0,
    subtotal: 0,
    type: PRODUCT_TYPES.COMMENT,
    isOptional: true
} as Item;