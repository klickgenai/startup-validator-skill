// =============================================================================
// Error Handling Tests — covers all error branches
// =============================================================================

import request from 'supertest';
import express from 'express';
import pino from 'pino';
import { createErrorHandler } from '../../src/middleware/error-handler';
import { AppError, InternalError, NotFoundError, RateLimitError } from '../../src/errors';
import { ZodError, z } from 'zod';
import { correlationIdMiddleware } from '../../src/middleware/correlation-id';

function buildTestApp(errorToThrow: Error) {
  const logger = pino({ level: 'silent' });
  const app = express();
  app.use(correlationIdMiddleware);
  app.get('/trigger', (_req, _res, next) => next(errorToThrow));
  app.use(createErrorHandler(logger));
  return app;
}

describe('Error Handler', () => {
  it('should handle operational AppError', async () => {
    const app = buildTestApp(new NotFoundError('Widget'));
    const res = await request(app).get('/trigger').expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('Widget not found');
  });

  it('should handle non-operational AppError (InternalError)', async () => {
    const app = buildTestApp(new InternalError('DB crashed'));
    const res = await request(app).get('/trigger').expect(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('should handle ZodError', async () => {
    let zodError: ZodError;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
      throw new Error('Should not reach');
    } catch (err) {
      zodError = err as ZodError;
    }
    const app = buildTestApp(zodError!);
    const res = await request(app).get('/trigger').expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('should handle unexpected generic Error', async () => {
    const app = buildTestApp(new Error('Something went wrong'));
    const res = await request(app).get('/trigger').expect(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('An unexpected error occurred');
  });

  it('should handle RateLimitError', async () => {
    const app = buildTestApp(new RateLimitError());
    const res = await request(app).get('/trigger').expect(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('should handle AppError with details', async () => {
    const app = buildTestApp(new AppError('Bad request', 400, 'BAD_REQ', true, { field: 'name' }));
    const res = await request(app).get('/trigger').expect(400);
    expect(res.body.error.details).toEqual({ field: 'name' });
  });
});
