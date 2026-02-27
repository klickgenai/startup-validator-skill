const request = require('supertest');
const { createApp } = require('../src/app');
const { getDatabase, closeDatabase, resetDatabase } = require('../src/config/database');
const path = require('path');
const fs = require('fs');

// ─── Test Setup ─────────────────────────────────────────────────────────────

let app;
let dbPath;

beforeAll(() => {
  // Use env vars for test config (no .env file needed)
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-for-unit-tests-only-32chars!!';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.BCRYPT_SALT_ROUNDS = '4'; // Faster hashing in tests

  // Each test file gets its own database
  dbPath = path.join(__dirname, `test-auth-${Date.now()}.db`);
  process.env.DB_PATH = dbPath;

  resetDatabase();
  getDatabase(dbPath);
  app = createApp();
});

afterAll(() => {
  closeDatabase();
  // Clean up test database files
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
  } catch (e) {
    // Ignore cleanup errors
  }
});

// ─── Helper ─────────────────────────────────────────────────────────────────

const validUser = {
  email: 'test@example.com',
  password: 'securePassword123',
  name: 'Test User',
};

// ─── POST /api/auth/register ────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('happy path — registers a new user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.name).toBe(validUser.name);
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.token).toBeDefined();
    // Must not return password hash
    expect(res.body.data.user.password_hash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('duplicate email — returns 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  test('missing required fields — returns 400 with validation errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);
  });

  test('invalid email format — returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'securePassword123', name: 'Test' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('password too short — returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@test.com', password: '1234567', name: 'Test' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('name too long — returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'long@test.com', password: 'securePassword123', name: 'A'.repeat(101) })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('email is case-insensitive and trimmed', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '  CaseTest@Example.COM  ', password: 'securePassword123', name: 'Case Test' })
      .expect(201);

    expect(res.body.data.user.email).toBe('casetest@example.com');
  });
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('happy path — logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  test('wrong password — returns 401 with vague message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrongPassword123' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    // Message must not reveal whether the email exists
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('nonexistent email — returns 401 with same vague message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'somePassword123' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('missing fields — returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── Auth Token Validation ──────────────────────────────────────────────────

describe('Authentication token', () => {
  test('no token — returns 401 on protected routes', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('invalid token — returns 401', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  test('empty bearer — returns 401', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer ')
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ─── Consistent Response Shape ──────────────────────────────────────────────

describe('Response shape consistency', () => {
  test('success responses have { success: true, data: {...} }', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
  });

  test('error responses have { success: false, error: { code, message } }', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@test.com', password: 'wrong' })
      .expect(401);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('data');
  });
});
