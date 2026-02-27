// =============================================================================
// Task Integration Tests — comprehensive coverage per guardrails
// Happy path + auth failure + validation failure + not found + ownership violation
// =============================================================================

import request from 'supertest';
import { createTestApp, createAuthenticatedUser, resetUserCounter } from '../helpers';
import type { TestApp, TestUser } from '../helpers';
import { buildCreateTaskInput, resetTaskFactory } from '../factories';

describe('Tasks API', () => {
  let testApp: TestApp;
  let user: TestUser;
  let otherUser: TestUser;

  beforeAll(async () => {
    testApp = createTestApp();
    resetUserCounter();
    resetTaskFactory();
    user = await createAuthenticatedUser(testApp.app);
    otherUser = await createAuthenticatedUser(testApp.app);
  });

  afterAll(() => {
    testApp.cleanup();
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/tasks — Create
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/tasks', () => {
    it('should create a task with all fields', async () => {
      const input = buildCreateTaskInput({
        title: 'Full Task',
        description: 'A full description',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-31T23:59:59.000Z',
      });

      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send(input)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Full Task');
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.dueDate).toBe('2026-12-31T23:59:59.000Z');
      expect(res.body.data.version).toBe(0);
      expect(res.body.data.userId).toBe(user.userId);
    });

    it('should create a task with only title (defaults)', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Minimal Task' })
        .expect(201);

      expect(res.body.data.status).toBe('todo');
      expect(res.body.data.priority).toBe('medium');
      expect(res.body.data.description).toBeNull();
      expect(res.body.data.dueDate).toBeNull();
    });

    it('should return 401 without auth', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .send({ title: 'No Auth' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Bad Token' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing title', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ description: 'No title' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Bad Status', status: 'invalid' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid priority', async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Bad Priority', priority: 'critical' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/tasks — List with pagination
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/tasks', () => {
    let taskListApp: TestApp;
    let listUser: TestUser;

    beforeAll(async () => {
      taskListApp = createTestApp();
      listUser = await createAuthenticatedUser(taskListApp.app);

      // Create 5 tasks
      for (let i = 0; i < 5; i++) {
        const input = buildCreateTaskInput({
          title: `List Task ${i}`,
          status: i < 2 ? 'todo' : 'done',
          priority: i === 0 ? 'high' : 'low',
        });
        await request(taskListApp.app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${listUser.token}`)
          .send(input);
      }
    });

    afterAll(() => {
      taskListApp.cleanup();
    });

    it('should list tasks with pagination metadata', async () => {
      const res = await request(taskListApp.app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${listUser.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(5);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.totalItems).toBe(5);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.hasNextPage).toBe(false);
      expect(res.body.meta.hasPreviousPage).toBe(false);
    });

    it('should paginate results', async () => {
      const res = await request(taskListApp.app)
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${listUser.token}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.totalItems).toBe(5);
      expect(res.body.meta.totalPages).toBe(3);
      expect(res.body.meta.hasNextPage).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(taskListApp.app)
        .get('/api/v1/tasks?status=todo')
        .set('Authorization', `Bearer ${listUser.token}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);
      for (const task of res.body.data) {
        expect(task.status).toBe('todo');
      }
    });

    it('should filter by priority', async () => {
      const res = await request(taskListApp.app)
        .get('/api/v1/tasks?priority=high')
        .set('Authorization', `Bearer ${listUser.token}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].priority).toBe('high');
    });

    it('should filter by search term', async () => {
      const res = await request(taskListApp.app)
        .get('/api/v1/tasks?search=List Task 0')
        .set('Authorization', `Bearer ${listUser.token}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without auth', async () => {
      await request(taskListApp.app).get('/api/v1/tasks').expect(401);
    });

    it('should not return other user tasks (ownership)', async () => {
      const otherUserInList = await createAuthenticatedUser(taskListApp.app);
      const res = await request(taskListApp.app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${otherUserInList.token}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/tasks/:id — Get by ID
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeAll(async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send(buildCreateTaskInput({ title: 'Get By ID Task' }));
      taskId = res.body.data.id;
    });

    it('should return the task by ID', async () => {
      const res = await request(testApp.app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(taskId);
      expect(res.body.data.title).toBe('Get By ID Task');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(testApp.app)
        .get('/api/v1/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for another user task (ownership violation returns 404)', async () => {
      const res = await request(testApp.app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(testApp.app)
        .get('/api/v1/tasks/not-a-uuid')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth', async () => {
      await request(testApp.app).get(`/api/v1/tasks/${taskId}`).expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /api/v1/tasks/:id — Update
  // ---------------------------------------------------------------------------
  describe('PUT /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send(buildCreateTaskInput({ title: 'Update Me' }));
      taskId = res.body.data.id;
    });

    it('should update task fields', async () => {
      const res = await request(testApp.app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Updated Title', status: 'done', version: 0 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.status).toBe('done');
      expect(res.body.data.version).toBe(1);
    });

    it('should return 409 for version conflict (optimistic locking)', async () => {
      // First update succeeds
      await request(testApp.app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'First Update', version: 0 })
        .expect(200);

      // Second update with stale version fails
      const res = await request(testApp.app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Stale Update', version: 0 })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(testApp.app)
        .put('/api/v1/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Ghost', version: 0 })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for another user task (ownership)', async () => {
      const res = await request(testApp.app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send({ title: 'Hijack', version: 0 })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for missing version', async () => {
      const res = await request(testApp.app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'No Version' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth', async () => {
      await request(testApp.app)
        .put(`/api/v1/tasks/${taskId}`)
        .send({ title: 'No Auth', version: 0 })
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/v1/tasks/:id — Delete
  // ---------------------------------------------------------------------------
  describe('DELETE /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const res = await request(testApp.app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .send(buildCreateTaskInput({ title: 'Delete Me' }));
      taskId = res.body.data.id;
    });

    it('should delete the task and return 204', async () => {
      await request(testApp.app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(204);

      // Verify it's gone
      await request(testApp.app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      await request(testApp.app)
        .delete('/api/v1/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404);
    });

    it('should return 404 for another user task (ownership)', async () => {
      await request(testApp.app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(testApp.app)
        .delete(`/api/v1/tasks/${taskId}`)
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // Rate Limiting
  // ---------------------------------------------------------------------------
  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const res = await request(testApp.app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });
  });
});
