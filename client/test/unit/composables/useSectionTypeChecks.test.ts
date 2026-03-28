import { describe, it, expect } from 'vitest';
import {
  isTableContent,
  isInfo,
  isProducts,
  isTotals,
  isMilestones,
  isComment,
  createSectionId,
} from '../../../src/composables/useSectionTypeChecks';
import type { Item, Section } from '../../../src/types/Proposal';

const T = {
  COVER_LETTER: 'COVER_LETTER',
  PRODUCTS: 'PRODUCTS',
  INFO: 'INFO',
  TOTALS: 'TOTALS',
  MILESTONES: 'MILESTONES',
  TERMS_AND_CONDITIONS: 'TERMS_AND_CONDITIONS',
};

function makeSection(type: string, id = 99): Section {
  return {
    id,
    title: 'Section',
    type,
    order: 1,
    isOptional: false,
    isLocked: false,
    isReference: false,
    blockRemoval: false,
  };
}

function makeItem(type: string): Item {
  return {
    id: 1,
    title: '',
    description: '',
    order: 1,
    qty: 0,
    cost: 0,
    price: 0,
    type,
    isOptional: false,
    margin: 0,
    subtotal: 0,
  };
}

describe('isTableContent', () => {
  it('returns true for PRODUCTS', () => expect(isTableContent(T.PRODUCTS)).toBe(true));
  it('returns true for MILESTONES', () => expect(isTableContent(T.MILESTONES)).toBe(true));
  it('returns false for INFO', () => expect(isTableContent(T.INFO)).toBe(false));
  it('returns false for TOTALS', () => expect(isTableContent(T.TOTALS)).toBe(false));
  it('returns false for COVER_LETTER', () => expect(isTableContent(T.COVER_LETTER)).toBe(false));
});

describe('isInfo', () => {
  it('returns true for INFO', () => expect(isInfo(T.INFO)).toBe(true));
  it('returns true for COVER_LETTER', () => expect(isInfo(T.COVER_LETTER)).toBe(true));
  it('returns true for TERMS_AND_CONDITIONS', () => expect(isInfo(T.TERMS_AND_CONDITIONS)).toBe(true));
  it('returns false for PRODUCTS', () => expect(isInfo(T.PRODUCTS)).toBe(false));
  it('returns false for TOTALS', () => expect(isInfo(T.TOTALS)).toBe(false));
});

describe('isProducts', () => {
  it('returns true for PRODUCTS', () => expect(isProducts(T.PRODUCTS)).toBe(true));
  it('returns false for MILESTONES', () => expect(isProducts(T.MILESTONES)).toBe(false));
  it('returns false for INFO', () => expect(isProducts(T.INFO)).toBe(false));
});

describe('isTotals', () => {
  it('returns true for TOTALS', () => expect(isTotals(T.TOTALS)).toBe(true));
  it('returns false for PRODUCTS', () => expect(isTotals(T.PRODUCTS)).toBe(false));
});

describe('isMilestones', () => {
  it('returns true for MILESTONES', () => expect(isMilestones(T.MILESTONES)).toBe(true));
  it('returns false for PRODUCTS', () => expect(isMilestones(T.PRODUCTS)).toBe(false));
});

describe('isComment', () => {
  it('returns true when item type is COMMENT', () => {
    expect(isComment(makeItem('COMMENT'))).toBe(true);
  });
  it('returns false for PRODUCT type', () => {
    expect(isComment(makeItem('PRODUCT'))).toBe(false);
  });
});

describe('createSectionId', () => {
  it('returns lowercase type for COVER_LETTER', () => {
    expect(createSectionId(makeSection(T.COVER_LETTER))).toBe('cover_letter');
  });

  it('returns lowercase type for TERMS_AND_CONDITIONS', () => {
    expect(createSectionId(makeSection(T.TERMS_AND_CONDITIONS))).toBe('terms_and_conditions');
  });

  it('returns section_{id} for a PRODUCTS section', () => {
    expect(createSectionId(makeSection(T.PRODUCTS, 42))).toBe('section_42');
  });

  it('returns section_{id} for an INFO section', () => {
    expect(createSectionId(makeSection(T.INFO, 7))).toBe('section_7');
  });

  it('returns section_{id} for a MILESTONES section', () => {
    expect(createSectionId(makeSection(T.MILESTONES, 15))).toBe('section_15');
  });
});
