import { hashPassword, verifyPassword } from '../../../src/server/helpers/passwords';

// Note: bcrypt with SALT_ROUNDS=12 is intentionally slow (~300ms per hash).
// Do not mock bcrypt — the point is to test the real implementation.

jest.setTimeout(30000);

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('MySecret123!');
    expect(typeof hash).toBe('string');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('produces different hashes for the same input (salted)', async () => {
    const hash1 = await hashPassword('SamePassword');
    const hash2 = await hashPassword('SamePassword');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  let hash: string;

  beforeAll(async () => {
    hash = await hashPassword('CorrectHorseBatteryStaple');
  });

  it('returns true for the correct password', async () => {
    await expect(verifyPassword('CorrectHorseBatteryStaple', hash)).resolves.toBe(true);
  });

  it('returns false for an incorrect password', async () => {
    await expect(verifyPassword('WrongPassword', hash)).resolves.toBe(false);
  });

  it('returns false for an empty string', async () => {
    await expect(verifyPassword('', hash)).resolves.toBe(false);
  });
});
