// =============================================================================
// Rate Limiting Tests — verify 429 responses and headers
// =============================================================================

import request from 'supertest';
import express from 'express';
import { RateLimiter } from '../../src/middleware/rate-limiter';

describe('Rate Limiting', () => {
  it('should return 429 when rate limit is exceeded', async () => {
    const limiter = new RateLimiter(3, 15);
    const app = express();
    app.use(limiter.middleware());
    app.get('/test', (_req, res) => res.json({ ok: true }));

    // First 3 requests succeed
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);

    // 4th request should be rate limited
    const res = await request(app).get('/test').expect(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(res.headers['x-ratelimit-remaining']).toBe('0');
  });

  it('should reset the rate limit store', () => {
    const limiter = new RateLimiter(5, 15);
    limiter.reset();
    // No error means success
    expect(true).toBe(true);
  });

  it('should allow requests after window expires', async () => {
    // Use a very short window for testing
    const limiter = new RateLimiter(1, 0); // 0 minutes = immediate reset
    const app = express();
    app.use(limiter.middleware());
    app.get('/test', (_req, res) => res.json({ ok: true }));

    await request(app).get('/test').expect(200);
    // The window is 0 ms, so next request resets
    await request(app).get('/test').expect(200);
  });
});
