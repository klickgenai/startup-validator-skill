// =============================================================================
// Response Helper Tests — cover sendError and buildPaginationMeta branches
// =============================================================================

import express from 'express';
import request from 'supertest';
import { sendSuccess, sendPaginated, sendError, buildPaginationMeta } from '../../src/utils/response';

describe('Response Helpers', () => {
  it('sendError should include details when provided', async () => {
    const app = express();
    app.get('/test', (_req, res) => {
      sendError(res, 'TEST_ERR', 'test message', 422, { field: 'name' });
    });

    const res = await request(app).get('/test').expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TEST_ERR');
    expect(res.body.error.details).toEqual({ field: 'name' });
  });

  it('sendError should exclude details when undefined', async () => {
    const app = express();
    app.get('/test', (_req, res) => {
      sendError(res, 'NO_DETAIL', 'no details', 400);
    });

    const res = await request(app).get('/test').expect(400);
    expect(res.body.error.details).toBeUndefined();
  });

  it('sendSuccess should use custom status code', async () => {
    const app = express();
    app.get('/test', (_req, res) => {
      sendSuccess(res, { created: true }, 202);
    });

    await request(app).get('/test').expect(202);
  });

  it('sendPaginated should include meta', async () => {
    const app = express();
    app.get('/test', (_req, res) => {
      const meta = buildPaginationMeta(2, 10, 25);
      sendPaginated(res, [{ id: 1 }], meta);
    });

    const res = await request(app).get('/test').expect(200);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.totalPages).toBe(3);
    expect(res.body.meta.hasNextPage).toBe(true);
    expect(res.body.meta.hasPreviousPage).toBe(true);
  });

  it('buildPaginationMeta should handle zero items', () => {
    const meta = buildPaginationMeta(1, 10, 0);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });
});
