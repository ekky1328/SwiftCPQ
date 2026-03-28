import request from 'supertest';
import { randomUUID as uuidv4 } from 'crypto';
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
  tenant = await createTestTenant('Proposal Test Tenant');
  user = await createTestUser(tenant.id);
  cookies = await loginAs(app, user.username, user.password);
}, 30000);

afterAll(async () => {
  await db('proposal_version').whereIn(
    'proposal_id',
    db('proposal').where('tenant_id', tenant.id).select('id'),
  ).delete();
  await db('proposal_section_item').whereIn(
    'section_id',
    db('proposal_section').whereIn(
      'proposal_id',
      db('proposal').where('tenant_id', tenant.id).select('id'),
    ).select('id'),
  ).delete();
  await db('proposal_section').whereIn(
    'proposal_id',
    db('proposal').where('tenant_id', tenant.id).select('id'),
  ).delete();
  await db('proposal').where('tenant_id', tenant.id).delete();
  await db('user_refresh_token').where('tenant_id', tenant.id).delete();
  await db('user').where('tenant_id', tenant.id).delete();
  await db('tenant').where('id', tenant.id).delete();
  await db.destroy();
});

describe('POST /api/v1/proposal/:template_name', () => {
  it('creates a proposal with default template sections', async () => {
    const res = await request(app)
      .post('/api/v1/proposal/default')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('DRAFT');
    expect(Array.isArray(res.body.sections)).toBe(true);
    // Default template has 3 sections: COVER_LETTER, PRODUCTS, TERMS_AND_CONDITIONS
    expect(res.body.sections.length).toBe(3);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).post('/api/v1/proposal/default');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/proposal/', () => {
  it('returns 200 with a list of proposals', async () => {
    const res = await request(app)
      .get('/api/v1/proposal/')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/v1/proposal/');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/proposal/:id', () => {
  let proposalId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/proposal/default')
      .set('Cookie', cookies);
    proposalId = res.body.id;
  });

  it('returns the full proposal with sections', async () => {
    const res = await request(app)
      .get(`/api/v1/proposal/${proposalId}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(proposalId);
    expect(Array.isArray(res.body.sections)).toBe(true);
  });

  it('includes _totals in the response', async () => {
    const res = await request(app)
      .get(`/api/v1/proposal/${proposalId}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    // _totals should be present (may be empty object for a new proposal)
    expect(res.body._totals).toBeDefined();
  });

  it('returns 404 for an unknown proposal id', async () => {
    const res = await request(app)
      .get(`/api/v1/proposal/${uuidv4()}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/proposal/:id', () => {
  let proposalId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/proposal/default')
      .set('Cookie', cookies);
    proposalId = res.body.id;
  });

  it('deletes the proposal', async () => {
    const res = await request(app)
      .delete(`/api/v1/proposal/${proposalId}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);

    // Verify it's gone
    const checkRes = await request(app)
      .get(`/api/v1/proposal/${proposalId}`)
      .set('Cookie', cookies);
    expect(checkRes.status).toBe(404);
  });
});
