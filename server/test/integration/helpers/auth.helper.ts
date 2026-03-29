import { randomUUID as uuidv4 } from 'crypto';
import type { Application } from 'express';
import request from 'supertest';
import db from '../../../src/database/db';
import { hashPassword } from '../../../src/server/helpers/passwords';

export interface TestTenant {
  id: string;
  name: string;
}

export interface TestUser {
  id: string;
  username: string;
  password: string;
  tenantId: string;
}

/**
 * Creates an active tenant in the test database and returns its ID.
 */
export async function createTestTenant(name = 'Test Tenant'): Promise<TestTenant> {
  const id = uuidv4();
  await db('tenant').insert({
    id,
    name,
    status: 'ACTIVE',
  });
  return { id, name };
}

/**
 * Creates a user in the test database with a hashed password.
 * Returns the user's id, username, plaintext password, and tenantId.
 */
export async function createTestUser(
  tenantId: string,
  options: { username?: string; password?: string; isSuperAdmin?: boolean; isActive?: boolean } = {},
): Promise<TestUser> {
  const username = options.username ?? `testuser_${uuidv4().slice(0, 8)}`;
  const password = options.password ?? 'TestPassword123!';
  const passwordHash = await hashPassword(password);
  const id = uuidv4();

  await db('user').insert({
    id,
    tenant_id: tenantId,
    username,
    password_hash: passwordHash,
    first_name: 'Test',
    last_name: 'User',
    title: '',
    auth_provider: 'LOCAL',
    is_active: options.isActive ?? true,
    is_super_admin: options.isSuperAdmin ?? false,
  });

  return { id, username, password, tenantId };
}

/**
 * Performs a POST /api/v1/auth/login with the given credentials.
 * Returns the set-cookie headers from the response (for use in subsequent requests).
 */
export async function loginAs(
  app: Application,
  username: string,
  password: string,
): Promise<string[]> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ username, password });

  if (response.status !== 200) {
    throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.body)}`);
  }

  return response.headers['set-cookie'] as unknown as string[];
}

/**
 * Returns the x-service-token header for bypassing auth in tests.
 */
export function serviceTokenHeader(): Record<string, string> {
  return { 'x-service-token': process.env.INTERNAL_SERVICE_TOKEN ?? '' };
}
