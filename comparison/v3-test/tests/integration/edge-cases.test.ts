// =============================================================================
// Edge Case Tests — cover remaining branch gaps
// =============================================================================

import request from 'supertest';
import { createTestApp, createAuthenticatedUser } from '../helpers';
import type { TestApp, TestUser } from '../helpers';
import { buildCreateTaskInput } from '../factories';

describe('Edge Cases', () => {
  let testApp: TestApp;
  let user: TestUser;

  beforeAll(async () => {
    testApp = createTestApp();
    user = await createAuthenticatedUser(testApp.app);
  });

  afterAll(() => {
    testApp.cleanup();
  });

  // Cover task-service create with explicit null defaults
  it('should create a task with explicit null description and dueDate', async () => {
    const res = await request(testApp.app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        title: 'Null Fields Task',
        description: null,
        dueDate: null,
        status: 'todo',
        priority: 'low',
      })
      .expect(201);

    expect(res.body.data.description).toBeNull();
    expect(res.body.data.dueDate).toBeNull();
    expect(res.body.data.priority).toBe('low');
  });

  // Cover task update with partial fields to exercise change tracking branches
  it('should update only description field (track changes)', async () => {
    const createRes = await request(testApp.app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send(buildCreateTaskInput({ title: 'Change Tracking' }));

    const taskId = createRes.body.data.id;

    const res = await request(testApp.app)
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ description: 'Updated description', version: 0 })
      .expect(200);

    expect(res.body.data.description).toBe('Updated description');
    expect(res.body.data.title).toBe('Change Tracking');
  });

  // Cover update with null description and dueDate
  it('should update task with null description and dueDate', async () => {
    const createRes = await request(testApp.app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send(buildCreateTaskInput({ title: 'Null Update', description: 'Has desc' }));

    const taskId = createRes.body.data.id;

    const res = await request(testApp.app)
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ description: null, dueDate: null, version: 0 })
      .expect(200);

    expect(res.body.data.description).toBeNull();
  });

  // Cover update with all fields changed
  it('should update all task fields', async () => {
    const createRes = await request(testApp.app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send(buildCreateTaskInput({
        title: 'Before',
        description: 'Old desc',
        status: 'todo',
        priority: 'low',
      }));

    const taskId = createRes.body.data.id;

    const res = await request(testApp.app)
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        title: 'After',
        description: 'New desc',
        status: 'done',
        priority: 'high',
        dueDate: '2026-06-15T12:00:00.000Z',
        version: 0,
      })
      .expect(200);

    expect(res.body.data.title).toBe('After');
    expect(res.body.data.status).toBe('done');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.dueDate).toBe('2026-06-15T12:00:00.000Z');
  });

  // Cover health check degraded state
  it('should return degraded status when DB is closed', async () => {
    const degradedApp = createTestApp();

    // Close the DB to simulate failure
    degradedApp.db.close();

    const res = await request(degradedApp.app).get('/health').expect(503);

    expect(res.body.status).toBe('degraded');
    expect(res.body.dependencies.database.status).toBe('down');
  });
});
