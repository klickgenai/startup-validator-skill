/**
 * Auth endpoint tests.
 * Tests registration, login, validation, and security behaviors.
 */

const request = require('supertest');
const { setupTestDatabase, teardownTestDatabase } = require('./setup');
const app = require('../src/app');

beforeAll(() => {
  setupTestDatabase();
});

afterAll(() => {
  teardownTestDatabase();
});

describe('POST /api/auth/register', () => {
  test('should register a new user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'securePassword123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data).toHaveProperty('token');
    // Guardrail #8: password_hash should NEVER appear in response
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'anotherPassword123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  test('should normalize email to lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'UPPER@Example.COM', password: 'securePassword123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('upper@example.com');
  });

  test('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'securePassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject missing password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'another@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'securePassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should reject empty body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  test('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'securePassword123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data).toHaveProperty('token');
    // Guardrail #8: No password hash in response
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  test('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Guardrail #8: Generic error — don't reveal email exists
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  test('should reject non-existent email with same error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'securePassword123' });

    expect(res.status).toBe(401);
    // Same error message as wrong password (Guardrail #8)
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  test('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('API Security', () => {
  test('health endpoint should work without auth', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  test('unknown routes should return 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('response should not include X-Powered-By header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
