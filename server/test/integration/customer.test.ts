import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
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
let cookies: string[];

beforeAll(async () => {
  tenant = await createTestTenant('Customer Test Tenant');
  user = await createTestUser(tenant.id);
  cookies = await loginAs(app, user.username, user.password);
}, 30000);

afterAll(async () => {
  await db('customer').where('tenant_id', tenant.id).delete();
  await db('user_refresh_token').where('tenant_id', tenant.id).delete();
  await db('user').where('tenant_id', tenant.id).delete();
  await db('tenant').where('id', tenant.id).delete();
  await db.destroy();
});

describe('GET /api/v1/customer/', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app)
      .get('/api/v1/customer/')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/v1/customer/');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/customer/', () => {
  it('creates a new customer and returns it', async () => {
    const res = await request(app)
      .post('/api/v1/customer/')
      .set('Cookie', cookies)
      .send({ name: 'Acme Corp' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acme Corp');
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/customer/')
      .set('Cookie', cookies)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/customer/:id', () => {
  let customerId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/customer/')
      .set('Cookie', cookies)
      .send({ name: 'Get Test Corp' });
    customerId = res.body.id;
  });

  it('returns 200 with the customer', async () => {
    const res = await request(app)
      .get(`/api/v1/customer/${customerId}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(customerId);
    expect(res.body.name).toBe('Get Test Corp');
  });

  it('returns 404 for an unknown customer id', async () => {
    const res = await request(app)
      .get(`/api/v1/customer/${uuidv4()}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/customer/:id', () => {
  let customerId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/customer/')
      .set('Cookie', cookies)
      .send({ name: 'Update Me Corp' });
    customerId = res.body.id;
  });

  it('updates the customer name', async () => {
    const res = await request(app)
      .put(`/api/v1/customer/${customerId}`)
      .set('Cookie', cookies)
      .send({ name: 'Updated Corp' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Corp');
  });
});

describe('DELETE /api/v1/customer/:id', () => {
  let customerId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/customer/')
      .set('Cookie', cookies)
      .send({ name: 'Delete Me Corp' });
    customerId = res.body.id;
  });

  it('deletes the customer and returns success', async () => {
    const res = await request(app)
      .delete(`/api/v1/customer/${customerId}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);

    // Verify it's gone
    const checkRes = await request(app)
      .get(`/api/v1/customer/${customerId}`)
      .set('Cookie', cookies);
    expect(checkRes.status).toBe(404);
  });
});
