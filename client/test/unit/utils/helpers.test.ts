import { describe, it, expect } from 'vitest';
import { concatProposalIdentifier } from '../../../src/utils/helpers';
import type { Proposal } from '../../../src/types/Proposal';

function makeProposal(prefix?: string, identifier?: string, suffix?: string): Proposal {
  return {
    id: 1,
    prefix,
    identifier: identifier ?? '',
    suffix,
  } as unknown as Proposal;
}

describe('concatProposalIdentifier', () => {
  it('concatenates all three parts with dashes', () => {
    expect(concatProposalIdentifier(makeProposal('PRE', '42', 'SUF'))).toBe('PRE-42-SUF');
  });

  it('omits missing prefix', () => {
    expect(concatProposalIdentifier(makeProposal(undefined, '42', 'SUF'))).toBe('42-SUF');
  });

  it('omits missing suffix', () => {
    expect(concatProposalIdentifier(makeProposal('PRE', '42', undefined))).toBe('PRE-42');
  });

  it('returns only the identifier when prefix and suffix are absent', () => {
    expect(concatProposalIdentifier(makeProposal(undefined, '42', undefined))).toBe('42');
  });

  it('returns empty string when all parts are absent or falsy', () => {
    expect(concatProposalIdentifier(makeProposal('', '', ''))).toBe('');
  });

  it('handles numeric-style identifiers', () => {
    expect(concatProposalIdentifier(makeProposal('INV', '2025-001', undefined))).toBe('INV-2025-001');
  });
});
