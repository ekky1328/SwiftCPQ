export interface Proposal {
    id: number;
    version: number;
    identifier: string;
    title: string;
    description: string;
    status: string;
    author: Author;
    customer: Customer;
    sections: Section[];
    _totals?: Record<string, { total: number; margin: number; cost: number }>;
    _section_totals?: Record<string, { title: string, total: number; margin: number; cost: number }[]>;
}

export interface Section {
    id: number
    title: string
    type: string
    order: number
    recurrance?: null | string
    description?: string
    isOptional: boolean
    isLocked: boolean
    isReference?: boolean
    blockRemoval: boolean
    items?: Item[]
    milestones?: Milestone[]
    _totals?: { total: number; margin: number, cost: number };
}

export interface Item {
    id: number
    title: string
    description: string
    order: number
    qty: number
    cost: number
    price: number
    sku?: string
    type: string
    isOptional: boolean
    margin: number
    subtotal: number
}

export interface Milestone {
    id: number
    title: string
    description: string
    order: number
    dueDate: string
    amount: number
}