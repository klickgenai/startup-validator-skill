// =============================================================================
// Auth Integration Tests — happy path + auth failure + validation failure
// =============================================================================

import request from 'supertest';
import { createTestApp, type TestApp } from '../helpers';

describe('Auth API', () => {
  let testApp: TestApp;

  beforeAll(() => {
    testApp = createTestApp();
  });

  afterAll(() => {
    testApp.cleanup();
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/register
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/register')
        .send({ email: 'register@test.com', password: 'Password123!' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.email).toBe('register@test.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      // Register first
      await request(testApp.app)
        .post('/api/v1/auth/register')
        .send({ email: 'dup@test.com', password: 'Password123!' })
        .expect(201);

      // Duplicate
      const res = await request(testApp.app)
        .post('/api/v1/auth/register')
        .send({ email: 'dup@test.com', password: 'Password123!' })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'Password123!' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/register')
        .send({ email: 'short@test.com', password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing body', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/login
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/login', () => {
    const email = 'login@test.com';
    const password = 'Password123!';

    beforeAll(async () => {
      await request(testApp.app)
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);
    });

    it('should login with valid credentials', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing email', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/auth/login')
        .send({ password })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
