/**
 * Task endpoint tests.
 * Tests CRUD, ownership isolation, validation, pagination, filtering, and edge cases.
 */

const request = require('supertest');
const { setupTestDatabase, teardownTestDatabase } = require('./setup');
const app = require('../src/app');

let userAToken;
let userBToken;

beforeAll(async () => {
  setupTestDatabase();

  // Create two users to test ownership isolation
  const resA = await request(app)
    .post('/api/auth/register')
    .send({ email: 'usera@example.com', password: 'securePassword123' });
  userAToken = resA.body.data.token;

  const resB = await request(app)
    .post('/api/auth/register')
    .send({ email: 'userb@example.com', password: 'securePassword123' });
  userBToken = resB.body.data.token;
});

afterAll(() => {
  teardownTestDatabase();
});

// ── Authentication Guardrail Tests ──

describe('Task endpoints require authentication', () => {
  test('GET /api/tasks should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('POST /api/tasks should reject unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  test('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  test('should reject malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'NotBearer token');
    expect(res.status).toBe(401);
  });
});

// ── Create Task Tests ──

describe('POST /api/tasks', () => {
  test('should create a task with all fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Complete project',
        description: 'Finish the API implementation',
        status: 'in_progress',
        priority: 'high',
        due_date: '2026-12-31',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Complete project');
    expect(res.body.data.description).toBe('Finish the API implementation');
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.due_date).toBe('2026-12-31');
    expect(res.body.data).toHaveProperty('created_at');
    expect(res.body.data).toHaveProperty('updated_at');
  });

  test('should create a task with only title (defaults applied)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Minimal task' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Minimal task');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.priority).toBe('medium');
    expect(res.body.data.description).toBe('');
    expect(res.body.data.due_date).toBeNull();
  });

  test('should reject empty title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject missing title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ description: 'No title here' });

    expect(res.status).toBe(400);
  });

  test('should reject invalid status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Test', status: 'invalid' });

    expect(res.status).toBe(400);
  });

  test('should reject invalid priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Test', priority: 'urgent' });

    expect(res.status).toBe(400);
  });

  test('should reject invalid due_date format', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Test', due_date: '12/31/2026' });

    expect(res.status).toBe(400);
  });

  test('should reject invalid due_date (impossible date)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Test', due_date: '2026-02-30' });

    expect(res.status).toBe(400);
  });

  test('should trim whitespace from title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: '  Trimmed title  ' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Trimmed title');
  });
});

// ── Get Single Task Tests ──

describe('GET /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Task to fetch' });
    taskId = res.body.data.id;
  });

  test('should get a task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(taskId);
    expect(res.body.data.title).toBe('Task to fetch');
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .get('/api/tasks/99999')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('should reject invalid task ID', async () => {
    const res = await request(app)
      .get('/api/tasks/abc')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ID');
  });

  test('should reject negative task ID', async () => {
    const res = await request(app)
      .get('/api/tasks/-1')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(400);
  });
});

// ── Ownership Isolation Tests (CRITICAL) ──

describe('Ownership isolation', () => {
  let userATaskId;

  beforeAll(async () => {
    // User A creates a task
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'User A private task', description: 'Secret' });
    userATaskId = res.body.data.id;
  });

  test('User B should NOT see User A tasks in list', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    const userATasks = res.body.data.filter(t => t.title === 'User A private task');
    expect(userATasks).toHaveLength(0);
  });

  test('User B should NOT access User A task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
  });

  test('User B should NOT update User A task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ title: 'Hacked title' });

    expect(res.status).toBe(404);
  });

  test('User B should NOT delete User A task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);

    // Verify the task still exists for User A
    const verify = await request(app)
      .get(`/api/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(verify.status).toBe(200);
  });
});

// ── Update Task Tests ──

describe('PUT /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Task to update', status: 'todo', priority: 'low' });
    taskId = res.body.data.id;
  });

  test('should update task title', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated title');
  });

  test('should update task status', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  test('should update multiple fields at once', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'done', priority: 'high', due_date: '2026-06-15' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('done');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.due_date).toBe('2026-06-15');
  });

  test('should clear due_date with null', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ due_date: null });

    expect(res.status).toBe(200);
    expect(res.body.data.due_date).toBeNull();
  });

  test('should reject update with no fields', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject update with invalid status', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(400);
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/99999')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Does not exist' });

    expect(res.status).toBe(404);
  });
});

// ── Delete Task Tests ──

describe('DELETE /api/tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Task to delete' });
    taskId = res.body.data.id;
  });

  test('should delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone
    const verify = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(verify.status).toBe(404);
  });

  test('should return 404 when deleting non-existent task', async () => {
    const res = await request(app)
      .delete('/api/tasks/99999')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(404);
  });
});

// ── List Tasks / Pagination Tests ──

describe('GET /api/tasks (listing and pagination)', () => {
  let paginationToken;

  beforeAll(async () => {
    // Create a fresh user with controlled data
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'pagination@example.com', password: 'securePassword123' });
    paginationToken = userRes.body.data.token;

    // Create 5 tasks with different properties
    const tasks = [
      { title: 'Task 1', status: 'todo', priority: 'low' },
      { title: 'Task 2', status: 'in_progress', priority: 'medium' },
      { title: 'Task 3', status: 'done', priority: 'high' },
      { title: 'Task 4', status: 'todo', priority: 'high' },
      { title: 'Task 5', status: 'in_progress', priority: 'low' },
    ];

    for (const task of tasks) {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${paginationToken}`)
        .send(task);
    }
  });

  test('should return paginated results with metadata', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toHaveProperty('pagination');
    expect(res.body.meta.pagination).toHaveProperty('page');
    expect(res.body.meta.pagination).toHaveProperty('limit');
    expect(res.body.meta.pagination).toHaveProperty('total');
    expect(res.body.meta.pagination).toHaveProperty('totalPages');
    expect(res.body.meta.pagination).toHaveProperty('hasNextPage');
    expect(res.body.meta.pagination).toHaveProperty('hasPrevPage');
  });

  test('should respect page and limit params', async () => {
    const res = await request(app)
      .get('/api/tasks?page=1&limit=2')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.pagination.total).toBe(5);
    expect(res.body.meta.pagination.totalPages).toBe(3);
    expect(res.body.meta.pagination.hasNextPage).toBe(true);
    expect(res.body.meta.pagination.hasPrevPage).toBe(false);
  });

  test('should filter by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=todo')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    res.body.data.forEach(task => {
      expect(task.status).toBe('todo');
    });
  });

  test('should filter by priority', async () => {
    const res = await request(app)
      .get('/api/tasks?priority=high')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    res.body.data.forEach(task => {
      expect(task.priority).toBe('high');
    });
  });

  test('should sort by specified field', async () => {
    const res = await request(app)
      .get('/api/tasks?sort=title&order=asc')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.data.map(t => t.title);
    const sorted = [...titles].sort();
    expect(titles).toEqual(sorted);
  });

  test('should reject invalid status filter', async () => {
    const res = await request(app)
      .get('/api/tasks?status=invalid')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(400);
  });

  test('should reject invalid sort field', async () => {
    const res = await request(app)
      .get('/api/tasks?sort=password_hash')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(400);
  });

  test('should reject limit over 100', async () => {
    const res = await request(app)
      .get('/api/tasks?limit=101')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(400);
  });

  test('should reject negative page', async () => {
    const res = await request(app)
      .get('/api/tasks?page=-1')
      .set('Authorization', `Bearer ${paginationToken}`);

    expect(res.status).toBe(400);
  });
});
