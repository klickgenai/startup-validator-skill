// =============================================================================
// Health Check Integration Tests
// =============================================================================

import request from 'supertest';
import { createTestApp, type TestApp } from '../helpers';

describe('GET /health', () => {
  let testApp: TestApp;

  beforeAll(() => {
    testApp = createTestApp();
  });

  afterAll(() => {
    testApp.cleanup();
  });

  it('should return healthy status with DB latency', async () => {
    const res = await request(testApp.app).get('/health').expect(200);

    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.dependencies.database.status).toBe('up');
    expect(res.body.dependencies.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should include security headers', async () => {
    const res = await request(testApp.app).get('/health').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['permissions-policy']).toBeDefined();
  });

  it('should include correlation ID header', async () => {
    const res = await request(testApp.app).get('/health').expect(200);

    expect(res.headers['x-correlation-id']).toBeDefined();
  });

  it('should propagate provided correlation ID', async () => {
    const correlationId = 'test-correlation-id-123';
    const res = await request(testApp.app)
      .get('/health')
      .set('x-correlation-id', correlationId)
      .expect(200);

    expect(res.headers['x-correlation-id']).toBe(correlationId);
  });
});
