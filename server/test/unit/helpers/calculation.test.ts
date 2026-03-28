import { calculateProposalTotals } from '../../../src/server/helpers/calculation';
import { Proposal, Section, Item } from '../../../src/types/Proposal';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    title: 'Widget',
    description: '',
    order: 1,
    qty: 1,
    cost: 10,
    price: 20,
    type: 'PRODUCT',
    isOptional: false,
    margin: 10,
    subtotal: 20,
    ...overrides,
  };
}

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: 1,
    title: 'Default',
    type: 'PRODUCTS',
    order: 1,
    recurrance: 'ONE_TIME',
    description: '',
    isOptional: false,
    isLocked: false,
    isReference: false,
    blockRemoval: false,
    items: [],
    ...overrides,
  };
}

function makeProposal(sections: Section[]): Proposal {
  return {
    id: 1,
    version: 1,
    identifier: 'PROP-001',
    title: 'Test Proposal',
    description: '',
    status: 'DRAFT',
    author: { firstName: 'Test', lastName: 'User', email: 'test@example.com' },
    customer: {} as any,
    sections,
  };
}

describe('calculateProposalTotals', () => {
  it('calculates totals for a single mandatory item', () => {
    const item = makeItem({ qty: 2, cost: 5, price: 10, margin: 5, subtotal: 20 });
    const section = makeSection({ recurrance: 'ONE_TIME', items: [item] });
    const proposal = makeProposal([section]);

    calculateProposalTotals(proposal);

    expect(proposal._totals?.ONE_TIME.total).toBe(20);
    expect(proposal._totals?.ONE_TIME.cost).toBe(10); // qty * cost = 2 * 5
    expect(proposal._totals?.ONE_TIME.margin).toBe(5);
  });

  it('excludes optional items from _totals but includes them in _section_totals', () => {
    const mandatory = makeItem({ qty: 1, cost: 10, price: 20, margin: 10, subtotal: 20, isOptional: false });
    const optional = makeItem({ id: 2, qty: 1, cost: 5, price: 10, margin: 5, subtotal: 10, isOptional: true });
    const section = makeSection({ recurrance: 'ONE_TIME', items: [mandatory, optional] });
    const proposal = makeProposal([section]);

    calculateProposalTotals(proposal);

    // Only mandatory item counts in _totals
    expect(proposal._totals?.ONE_TIME.total).toBe(20);
    // _section_totals includes the section entry
    expect(proposal._section_totals?.ONE_TIME).toHaveLength(1);
    expect(proposal._section_totals?.ONE_TIME[0].total).toBe(20);
  });

  it('separates totals by recurrence type', () => {
    const oneTimeItem = makeItem({ qty: 1, cost: 10, price: 100, margin: 90, subtotal: 100 });
    const monthlyItem = makeItem({ qty: 1, cost: 5, price: 50, margin: 45, subtotal: 50 });
    const oneTimeSection = makeSection({ id: 1, recurrance: 'ONE_TIME', items: [oneTimeItem] });
    const monthlySection = makeSection({ id: 2, title: 'Monthly', recurrance: 'MONTHLY', items: [monthlyItem] });
    const proposal = makeProposal([oneTimeSection, monthlySection]);

    calculateProposalTotals(proposal);

    expect(proposal._totals?.ONE_TIME.total).toBe(100);
    expect(proposal._totals?.MONTHLY.total).toBe(50);
    expect(proposal._totals?.ONE_TIME).toBeDefined();
    expect(proposal._totals?.MONTHLY).toBeDefined();
  });

  it('excludes optional sections from _totals', () => {
    const item = makeItem({ qty: 1, cost: 10, price: 50, margin: 40, subtotal: 50 });
    const optionalSection = makeSection({ recurrance: 'ONE_TIME', isOptional: true, items: [item] });
    const proposal = makeProposal([optionalSection]);

    calculateProposalTotals(proposal);

    // Optional section not counted in _totals
    expect(proposal._totals?.ONE_TIME?.total ?? 0).toBe(0);
    // But it still appears in _section_totals
    expect(proposal._section_totals?.ONE_TIME[0].isOptional).toBe(true);
  });

  it('handles sections with no recurrence (skips them)', () => {
    const infoSection = makeSection({ recurrance: null, type: 'INFO', items: [] });
    const proposal = makeProposal([infoSection]);

    calculateProposalTotals(proposal);

    expect(proposal._totals).toEqual({});
    expect(proposal._section_totals).toBeUndefined();
  });

  it('handles empty items array', () => {
    const section = makeSection({ recurrance: 'ONE_TIME', items: [] });
    const proposal = makeProposal([section]);

    calculateProposalTotals(proposal);

    expect(proposal._totals?.ONE_TIME.total).toBe(0);
    expect(proposal._totals?.ONE_TIME.cost).toBe(0);
    expect(proposal._totals?.ONE_TIME.margin).toBe(0);
  });

  it('clears stale _totals before recalculating', () => {
    const item = makeItem({ qty: 1, cost: 10, price: 20, margin: 10, subtotal: 20 });
    const section = makeSection({ recurrance: 'ONE_TIME', items: [item] });
    const proposal = makeProposal([section]);

    // Pre-populate stale totals
    (proposal as any)._totals = { ONE_TIME: { total: 9999, margin: 9999, cost: 9999 } };

    calculateProposalTotals(proposal);

    expect(proposal._totals?.ONE_TIME.total).toBe(20);
  });

  it('handles floating-point values without drift via integer scaling', () => {
    // qty=3, cost=1.005 → raw cost = 3 * 1.005 = 3.015 (naive float may drift)
    const item = makeItem({ qty: 3, cost: 1.005, price: 3.333, margin: 2.328, subtotal: 9.999, isOptional: false });
    const section = makeSection({ recurrance: 'ONE_TIME', items: [item] });
    const proposal = makeProposal([section]);

    calculateProposalTotals(proposal);

    // subtotal = 9.999 rounded at scale → total should be 9.999
    expect(proposal._totals?.ONE_TIME.total).toBeCloseTo(9.999, 2);
    // cost = qty * cost = 3 * 1.005 = 3.015 (integer-scaled)
    expect(proposal._totals?.ONE_TIME.cost).toBeCloseTo(3.015, 2);
  });

  it('returns the proposal object', () => {
    const proposal = makeProposal([]);
    const result = calculateProposalTotals(proposal);
    expect(result).toBe(proposal);
  });
});
