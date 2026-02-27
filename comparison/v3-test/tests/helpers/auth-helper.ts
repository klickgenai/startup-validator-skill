// =============================================================================
// Auth Test Helper — register user and return token
// =============================================================================

import request from 'supertest';
import type { Express } from 'express';

export interface TestUser {
  email: string;
  password: string;
  token: string;
  userId: string;
}

let userCounter = 0;

export async function createAuthenticatedUser(
  app: Express,
  overrides?: { email?: string; password?: string },
): Promise<TestUser> {
  userCounter++;
  const email = overrides?.email ?? `testuser${userCounter}@example.com`;
  const password = overrides?.password ?? 'TestPassword123!';

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password })
    .expect(201);

  return {
    email,
    password,
    token: res.body.data.token as string,
    userId: res.body.data.user.id as string,
  };
}

export function resetUserCounter(): void {
  userCounter = 0;
}
