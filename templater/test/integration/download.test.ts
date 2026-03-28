import request from 'supertest';
import app from '../../src/app';

const VALID_SERVICE_TOKEN = 'test_internal_token';
const UNKNOWN_TEMPLATE = 'nonexistent_template_xyz';

beforeAll(() => {
  process.env.INTERNAL_SERVICE_TOKEN = VALID_SERVICE_TOKEN;
});

afterAll(() => {
  delete process.env.INTERNAL_SERVICE_TOKEN;
});

describe('GET /download/:templateId/:proposalId', () => {
  it('returns 401 when no x-service-token header is provided', async () => {
    const res = await request(app)
      .get(`/download/default/some-proposal-id`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 401 when an incorrect service token is provided', async () => {
    const res = await request(app)
      .get(`/download/default/some-proposal-id`)
      .set('x-service-token', 'wrong-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('returns 404 when the template does not exist (auth passes)', async () => {
    const res = await request(app)
      .get(`/download/${UNKNOWN_TEMPLATE}/some-proposal-id`)
      .set('x-service-token', VALID_SERVICE_TOKEN);

    // Auth passed, but the template file does not exist on disk
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Template not found');
  });
});
