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
let vendorId: string;

const SAMPLE_CSV = `sku,stock,cost\nSKU-001,10,19.99\nSKU-002,5,9.99\n`;

beforeAll(async () => {
  // Use a super admin user to bypass permission check on ingestion routes
  tenant = await createTestTenant('Ingestion Test Tenant');
  user = await createTestUser(tenant.id, { isSuperAdmin: true });
  cookies = await loginAs(app, user.username, user.password);

  // Create a vendor for the tenant
  const [result] = await db('vendor').insert({
    id: uuidv4(),
    tenant_id: tenant.id,
    name: 'Test Vendor',
    code: 'TSTVND',
    is_active: true,
  }).returning('id');
  vendorId = result.id ?? result;
}, 60000);

afterAll(async () => {
  await db('ingestion_job').where('tenant_id', tenant.id).delete();
  await db('vendor').where('id', vendorId).delete();
  await db('user_refresh_token').where('tenant_id', tenant.id).delete();
  await db('user').where('tenant_id', tenant.id).delete();
  await db('tenant').where('id', tenant.id).delete();
  await db.destroy();
});

describe('POST /api/v1/ingestion/:vendorId', () => {
  it('returns 202 with a jobId when given a valid CSV', async () => {
    const res = await request(app)
      .post(`/api/v1/ingestion/${vendorId}`)
      .set('Cookie', cookies)
      .set('Content-Type', 'text/csv')
      .send(SAMPLE_CSV);

    expect(res.status).toBe(202);
    expect(res.body.jobId).toBeDefined();
    expect(res.body.status).toBeDefined();
  });

  it('returns 404 for an unknown vendorId', async () => {
    const res = await request(app)
      .post(`/api/v1/ingestion/${uuidv4()}`)
      .set('Cookie', cookies)
      .set('Content-Type', 'text/csv')
      .send(SAMPLE_CSV);

    expect(res.status).toBe(404);
  });

  it('returns 400 for an empty CSV body', async () => {
    const res = await request(app)
      .post(`/api/v1/ingestion/${vendorId}`)
      .set('Cookie', cookies)
      .set('Content-Type', 'text/csv')
      .send('');

    expect(res.status).toBe(400);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .post(`/api/v1/ingestion/${vendorId}`)
      .set('Content-Type', 'text/csv')
      .send(SAMPLE_CSV);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/ingestion/:jobId/status', () => {
  let jobId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/v1/ingestion/${vendorId}`)
      .set('Cookie', cookies)
      .set('Content-Type', 'text/csv')
      .send(SAMPLE_CSV);
    jobId = res.body.jobId;
  });

  it('returns job status for an existing job', async () => {
    const res = await request(app)
      .get(`/api/v1/ingestion/${jobId}/status`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.jobId).toBe(jobId);
    expect(res.body.status).toBeDefined();
    expect(res.body.vendorId).toBe(vendorId);
  });

  it('returns 404 for an unknown job id', async () => {
    const res = await request(app)
      .get(`/api/v1/ingestion/${uuidv4()}/status`)
      .set('Cookie', cookies);

    expect(res.status).toBe(404);
  });
});
