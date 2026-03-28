import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
} from '../../../src/server/helpers/jwt';

const TEST_PAYLOAD: TokenPayload = {
  userId: 'user-123',
  tenantId: 'tenant-456',
  isSuperAdmin: false,
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test_access_secret_at_least_32_chars';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_ch';
});

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
});

describe('signAccessToken', () => {
  it('returns a non-empty string', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('throws when JWT_SECRET is not set', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => signAccessToken(TEST_PAYLOAD)).toThrow('JWT_SECRET is not set');
    process.env.JWT_SECRET = original;
  });
});

describe('signRefreshToken', () => {
  it('returns a non-empty string', () => {
    const token = signRefreshToken(TEST_PAYLOAD);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('throws when JWT_REFRESH_SECRET is not set', () => {
    const original = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => signRefreshToken(TEST_PAYLOAD)).toThrow('JWT_REFRESH_SECRET is not set');
    process.env.JWT_REFRESH_SECRET = original;
  });
});

describe('verifyAccessToken', () => {
  it('round-trips: sign then verify returns original payload', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
    expect(decoded.tenantId).toBe(TEST_PAYLOAD.tenantId);
    expect(decoded.isSuperAdmin).toBe(TEST_PAYLOAD.isSuperAdmin);
  });

  it('throws on a tampered token', () => {
    const token = signAccessToken(TEST_PAYLOAD);
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ userId: 'hacker' })).toString('base64url');
    const tampered = parts.join('.');
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('throws when verified with the wrong secret', () => {
    // Token signed with refresh secret should fail access token verification
    const token = signRefreshToken(TEST_PAYLOAD);
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('throws on an expired token', () => {
    jest.useFakeTimers();
    const token = signAccessToken(TEST_PAYLOAD);
    // Advance 16 minutes past expiry (access token expires in 15m)
    jest.advanceTimersByTime(16 * 60 * 1000);
    expect(() => verifyAccessToken(token)).toThrow();
    jest.useRealTimers();
  });
});

describe('verifyRefreshToken', () => {
  it('round-trips: sign then verify returns original payload', () => {
    const token = signRefreshToken(TEST_PAYLOAD);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
    expect(decoded.tenantId).toBe(TEST_PAYLOAD.tenantId);
  });

  it('throws when verified with the wrong secret', () => {
    // Token signed with access secret should fail refresh token verification
    const token = signAccessToken(TEST_PAYLOAD);
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});
