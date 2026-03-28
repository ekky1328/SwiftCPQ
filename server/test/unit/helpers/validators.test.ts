import { stripBackToProposal, ProposalPayload } from '../../../src/server/helpers/validators';

const CORE_SETTINGS_KEYS = [
  'prefix',
  'suffix',
  'logo',
  'currency',
  'timezone',
  'dateFormat',
  'contactInformationDefaults',
  'proposalSettingsDefaults',
  'selectedTemplate',
  'theme',
];

function makePayload(extra: Record<string, unknown> = {}): ProposalPayload {
  return {
    // Proposal keys
    id: 1,
    version: 1,
    identifier: 'PROP-001',
    title: 'Test Proposal',
    description: 'A description',
    status: 'DRAFT',
    author: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
    customer: {} as any,
    sections: [],
    // CoreSettings keys
    prefix: 'PRE',
    suffix: 'SUF',
    logo: 'logo.png',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    dateFormat: 'YYYY-MM-DD',
    contactInformationDefaults: {} as any,
    proposalSettingsDefaults: {} as any,
    selectedTemplate: 'default',
    staleInventoryDays: 30,
    theme: {} as any,
    ...extra,
  } as unknown as ProposalPayload;
}

describe('stripBackToProposal', () => {
  it('removes all CoreSettings keys', () => {
    const payload = makePayload();
    stripBackToProposal(payload);

    for (const key of CORE_SETTINGS_KEYS) {
      expect(payload).not.toHaveProperty(key);
    }
  });

  it('preserves all Proposal-specific keys', () => {
    const payload = makePayload();
    stripBackToProposal(payload);

    expect(payload.id).toBe(1);
    expect(payload.identifier).toBe('PROP-001');
    expect(payload.title).toBe('Test Proposal');
    expect(payload.sections).toEqual([]);
  });

  it('mutates and returns the same object reference', () => {
    const payload = makePayload();
    const result = stripBackToProposal(payload);
    expect(result).toBe(payload);
  });

  it('works when some CoreSettings keys are absent', () => {
    const payload = makePayload();
    delete (payload as any).logo;
    delete (payload as any).theme;

    expect(() => stripBackToProposal(payload)).not.toThrow();
    expect(payload).not.toHaveProperty('prefix');
  });
});
