const request = require('supertest');
const { createApp } = require('../src/app');
const { getDatabase, closeDatabase, resetDatabase } = require('../src/config/database');
const path = require('path');
const fs = require('fs');

// ─── Test Setup ─────────────────────────────────────────────────────────────

let app;
let dbPath;
let authToken;
let userId;
let secondAuthToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-for-unit-tests-only-32chars!!';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.BCRYPT_SALT_ROUNDS = '4';

  dbPath = path.join(__dirname, `test-tasks-${Date.now()}.db`);
  process.env.DB_PATH = dbPath;

  resetDatabase();
  getDatabase(dbPath);
  app = createApp();

  // Register a user to get a token
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'tasks@test.com', password: 'securePassword123', name: 'Task Tester' });

  authToken = res.body.data.token;
  userId = res.body.data.user.id;

  // Register a second user for ownership tests
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ email: 'other@test.com', password: 'securePassword123', name: 'Other User' });

  secondAuthToken = res2.body.data.token;
});

afterAll(() => {
  closeDatabase();
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
  } catch (e) {
    // Ignore cleanup errors
  }
});

// ─── Helper ─────────────────────────────────────────────────────────────────

function authHeader(token) {
  return ['Authorization', `Bearer ${token || authToken}`];
}

async function createTask(data = {}, token) {
  const defaults = {
    title: 'Test Task',
    description: 'A test task',
    status: 'todo',
    priority: 'medium',
    due_date: '2026-12-31',
  };

  const res = await request(app)
    .post('/api/tasks')
    .set(...authHeader(token))
    .send({ ...defaults, ...data });

  return res;
}

// ─── POST /api/tasks — Create ───────────────────────────────────────────────

describe('POST /api/tasks', () => {
  test('happy path — creates a task', async () => {
    const res = await createTask();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Task');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.priority).toBe('medium');
    expect(res.body.data.due_date).toBe('2026-12-31');
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.created_at).toBeDefined();
    expect(res.body.data.updated_at).toBeDefined();
  });

  test('minimal fields — only title required', async () => {
    const res = await createTask({ title: 'Minimal', description: undefined, status: undefined, priority: undefined, due_date: undefined });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Minimal');
    expect(res.body.data.status).toBe('todo'); // default
    expect(res.body.data.priority).toBe('medium'); // default
  });

  test('auth failure — no token returns 401', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'No Auth' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('invalid input — missing title returns 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(...authHeader())
      .send({ description: 'No title' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('invalid input — bad status enum returns 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(...authHeader())
      .send({ title: 'Bad Status', status: 'invalid_status' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('invalid input — bad priority enum returns 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(...authHeader())
      .send({ title: 'Bad Priority', priority: 'urgent' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('invalid input — bad date format returns 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(...authHeader())
      .send({ title: 'Bad Date', due_date: '31-12-2026' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('invalid input — title too long returns 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(...authHeader())
      .send({ title: 'A'.repeat(256) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /api/tasks — List ──────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  test('happy path — returns paginated list of own tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set(...authHeader())
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBeDefined();
    expect(res.body.meta.total).toBeDefined();
    expect(res.body.meta.total_pages).toBeDefined();
  });

  test('pagination — page and limit work', async () => {
    const res = await request(app)
      .get('/api/tasks?page=1&limit=1')
      .set(...authHeader())
      .expect(200);

    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(1);
  });

  test('filter by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=todo')
      .set(...authHeader())
      .expect(200);

    res.body.data.forEach((task) => {
      expect(task.status).toBe('todo');
    });
  });

  test('filter by priority', async () => {
    await createTask({ title: 'High Prio', priority: 'high' });

    const res = await request(app)
      .get('/api/tasks?priority=high')
      .set(...authHeader())
      .expect(200);

    res.body.data.forEach((task) => {
      expect(task.priority).toBe('high');
    });
  });

  test('invalid filter enum — returns 400', async () => {
    const res = await request(app)
      .get('/api/tasks?status=invalid')
      .set(...authHeader())
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('auth failure — no token returns 401', async () => {
    const res = await request(app).get('/api/tasks').expect(401);
    expect(res.body.success).toBe(false);
  });

  test('ownership — second user sees no tasks from first user', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set(...authHeader(secondAuthToken))
      .expect(200);

    expect(res.body.data.length).toBe(0);
    expect(res.body.meta.total).toBe(0);
  });
});

// ─── GET /api/tasks/:id — Get Single ────────────────────────────────────────

describe('GET /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await createTask({ title: 'Get Me' });
    taskId = res.body.data.id;
  });

  test('happy path — returns the task', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(taskId);
    expect(res.body.data.title).toBe('Get Me');
  });

  test('not found — returns 404', async () => {
    const res = await request(app)
      .get('/api/tasks/00000000-0000-4000-a000-000000000000')
      .set(...authHeader())
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('invalid UUID format — returns 400', async () => {
    const res = await request(app)
      .get('/api/tasks/not-a-uuid')
      .set(...authHeader())
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('auth failure — no token returns 401', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('ownership — other user cannot see this task (returns 404, not 403)', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set(...authHeader(secondAuthToken))
      .expect(404);

    // Returns 404 instead of 403 to avoid leaking task existence
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── PUT /api/tasks/:id — Update ────────────────────────────────────────────

describe('PUT /api/tasks/:id', () => {
  let taskId;
  let currentVersion;

  beforeAll(async () => {
    const res = await createTask({ title: 'Update Me' });
    taskId = res.body.data.id;
    currentVersion = res.body.data.version;
  });

  test('happy path — updates the task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .send({ title: 'Updated Title', version: currentVersion })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title');
    expect(res.body.data.version).toBe(currentVersion + 1);

    currentVersion = res.body.data.version;
  });

  test('partial update — only changes provided fields', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .send({ status: 'in_progress', version: currentVersion })
      .expect(200);

    expect(res.body.data.title).toBe('Updated Title'); // unchanged
    expect(res.body.data.status).toBe('in_progress'); // changed

    currentVersion = res.body.data.version;
  });

  test('optimistic locking — stale version returns 409', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .send({ title: 'Stale', version: 1 }) // old version
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('missing version — returns 400', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .send({ title: 'No Version' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('not found — returns 404', async () => {
    const res = await request(app)
      .put('/api/tasks/00000000-0000-4000-a000-000000000000')
      .set(...authHeader())
      .send({ title: 'Ghost', version: 1 })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('invalid input — bad status enum returns 400', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .send({ status: 'cancelled', version: currentVersion })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('auth failure — no token returns 401', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'No Auth', version: currentVersion })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('ownership — other user cannot update (returns 404)', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(...authHeader(secondAuthToken))
      .send({ title: 'Hijacked', version: currentVersion })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── DELETE /api/tasks/:id ──────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await createTask({ title: 'Delete Me' });
    taskId = res.body.data.id;
  });

  test('ownership — other user cannot delete (returns 404)', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(...authHeader(secondAuthToken))
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('happy path — deletes the task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Task deleted successfully');
  });

  test('already deleted — returns 404', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(...authHeader())
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('not found — returns 404', async () => {
    const res = await request(app)
      .delete('/api/tasks/00000000-0000-4000-a000-000000000000')
      .set(...authHeader())
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('invalid UUID — returns 400', async () => {
    const res = await request(app)
      .delete('/api/tasks/not-a-uuid')
      .set(...authHeader())
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('auth failure — no token returns 401', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

// ─── 404 Route ──────────────────────────────────────────────────────────────

describe('Undefined routes', () => {
  test('returns 404 with consistent shape', async () => {
    const res = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── Health Check ───────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});
