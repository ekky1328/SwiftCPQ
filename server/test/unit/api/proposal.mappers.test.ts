import {
  mapSectionFromDb,
  mapItemFromDb,
  mapMilestoneFromDb,
} from '../../../src/server/api/proposal';

describe('mapSectionFromDb', () => {
  it('maps snake_case DB columns to camelCase Section fields', () => {
    const row = {
      id: 1,
      title: 'Products',
      type: 'PRODUCTS',
      order: 2,
      recurrence: 'ONE_TIME',
      description: 'Main products',
      is_optional: false,
      is_locked: false,
      is_reference: false,
      block_removal: false,
    };
    const section = mapSectionFromDb(row);

    expect(section.id).toBe(1);
    expect(section.title).toBe('Products');
    expect(section.type).toBe('PRODUCTS');
    expect(section.order).toBe(2);
    expect(section.recurrance).toBe('ONE_TIME'); // note: mapped from 'recurrence'
    expect(section.description).toBe('Main products');
    expect(section.isOptional).toBe(false);
    expect(section.isLocked).toBe(false);
    expect(section.isReference).toBe(false);
    expect(section.blockRemoval).toBe(false);
  });

  it('maps null recurrence to null', () => {
    const row = {
      id: 2,
      title: 'Cover Letter',
      type: 'COVER_LETTER',
      order: 1,
      recurrence: null,
      description: '',
      is_optional: false,
      is_locked: true,
      is_reference: false,
      block_removal: true,
    };
    const section = mapSectionFromDb(row);
    expect(section.recurrance).toBeNull();
  });

  it('defaults empty description to empty string', () => {
    const row = {
      id: 3,
      title: 'Section',
      type: 'INFO',
      order: 1,
      recurrence: null,
      description: null,
      is_optional: false,
      is_locked: false,
      is_reference: false,
      block_removal: false,
    };
    const section = mapSectionFromDb(row);
    expect(section.description).toBe('');
  });
});

describe('mapItemFromDb', () => {
  it('converts cost, price, margin, subtotal from cents to dollars', () => {
    const row = {
      id: 10,
      title: 'Widget',
      description: 'A widget',
      order: 1,
      qty: 2,
      cost: 1000,    // $10.00
      price: 2000,   // $20.00
      sku: 'SKU-001',
      type: 'PRODUCT',
      is_optional: false,
      margin: 1000,  // $10.00
      subtotal: 4000, // $40.00
    };
    const item = mapItemFromDb(row);

    expect(item.cost).toBe(10);
    expect(item.price).toBe(20);
    expect(item.margin).toBe(10);
    expect(item.subtotal).toBe(40);
  });

  it('maps snake_case columns to camelCase', () => {
    const row = {
      id: 11,
      title: 'Item',
      description: 'Desc',
      order: 1,
      qty: 1,
      cost: 500,
      price: 1000,
      sku: 'ABC',
      type: 'PRODUCT',
      is_optional: true,
      margin: 500,
      subtotal: 1000,
    };
    const item = mapItemFromDb(row);

    expect(item.isOptional).toBe(true);
    expect(item.sku).toBe('ABC');
  });

  it('maps null sku to undefined', () => {
    const row = {
      id: 12,
      title: 'No SKU Item',
      description: '',
      order: 1,
      qty: 1,
      cost: 0,
      price: 0,
      sku: null,
      type: 'COMMENT',
      is_optional: false,
      margin: 0,
      subtotal: 0,
    };
    const item = mapItemFromDb(row);
    expect(item.sku).toBeUndefined();
  });
});

describe('mapMilestoneFromDb', () => {
  it('converts amount from cents to dollars', () => {
    const row = {
      id: 20,
      title: 'Phase 1',
      description: 'Initial phase',
      order: 1,
      due_date: '2025-06-01',
      amount: 500000, // $5000.00
    };
    const milestone = mapMilestoneFromDb(row);

    expect(milestone.amount).toBe(5000);
  });

  it('maps due_date to dueDate', () => {
    const row = {
      id: 21,
      title: 'Milestone',
      description: '',
      order: 1,
      due_date: '2025-12-31',
      amount: 0,
    };
    const milestone = mapMilestoneFromDb(row);

    expect(milestone.dueDate).toBe('2025-12-31');
  });
});
