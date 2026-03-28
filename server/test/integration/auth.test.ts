import request from 'supertest';
import db from '../../src/database/db';
import app from './helpers/testApp';
import {
  createTestTenant,
  createTestUser,
  loginAs,
  type TestUser,
  type TestTenant,
} from './helpers/auth.helper';

let tenant: TestTenant;
let user: TestUser;

beforeAll(async () => {
  tenant = await createTestTenant('Auth Test Tenant');
  user = await createTestUser(tenant.id, { username: 'auth_test_user', password: 'TestPass123!' });
}, 30000);

afterAll(async () => {
  await db('user_refresh_token').where('tenant_id', tenant.id).delete();
  await db('user').where('tenant_id', tenant.id).delete();
  await db('tenant').where('id', tenant.id).delete();
  await db.destroy();
});

describe('GET /api/v1/auth/config', () => {
  it('returns 200 with local: true and entra status', async () => {
    const res = await request(app).get('/api/v1/auth/config');
    expect(res.status).toBe(200);
    expect(res.body.local).toBe(true);
    expect(typeof res.body.entra).toBe('boolean');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 and sets cookies on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: user.username, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c: string) => c.startsWith('refresh_token='))).toBe(true);
  }, 30000);

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: user.username, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  }, 30000);

  it('returns 401 for unknown username', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'nobody@nowhere.com', password: 'AnyPassword' });

    expect(res.status).toBe(401);
  }, 30000);

  it('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'SomePass' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: user.username });

    expect(res.status).toBe(400);
  });

  it('returns 403 for inactive user', async () => {
    const inactiveUser = await createTestUser(tenant.id, { isActive: false });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: inactiveUser.username, password: inactiveUser.password });

    expect(res.status).toBe(403);

    await db('user').where('id', inactiveUser.id).delete();
  }, 30000);
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 200 and clears cookies', async () => {
    const cookies = await loginAs(app, user.username, user.password);

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out');

    // Cookies should be cleared (expired)
    const setCookies = res.headers['set-cookie'] as unknown as string[];
    expect(setCookies.some((c: string) => c.includes('access_token=;'))).toBe(true);
  }, 30000);
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns 200 and rotates tokens', async () => {
    const cookies = await loginAs(app, user.username, user.password);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Token refreshed');

    const newCookies = res.headers['set-cookie'] as unknown as string[];
    expect(newCookies.some((c: string) => c.startsWith('access_token='))).toBe(true);
  }, 30000);

  it('returns 401 when no refresh token cookie is present', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 200 with user profile when authenticated', async () => {
    const cookies = await loginAs(app, user.username, user.password);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(user.username);
    expect(res.body.tenantId).toBe(tenant.id);
  }, 30000);

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
