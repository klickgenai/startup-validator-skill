// =============================================================================
// Rate Limiting Middleware — auth: 10/15min, general: 100/15min (guardrail 16)
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import type { Env } from '../config';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMinutes: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req);
      const now = Date.now();
      const entry = this.store.get(key);

      if (!entry || now > entry.resetAt) {
        this.store.set(key, { count: 1, resetAt: now + this.windowMs });
        this.setHeaders(res, this.maxRequests - 1, now + this.windowMs);
        next();
        return;
      }

      entry.count++;

      if (entry.count > this.maxRequests) {
        this.setHeaders(res, 0, entry.resetAt);
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later',
          },
        });
        return;
      }

      this.setHeaders(res, this.maxRequests - entry.count, entry.resetAt);
      next();
    };
  }

  private getKey(req: Request): string {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return ip;
  }

  private setHeaders(res: Response, remaining: number, resetAt: number): void {
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
  }

  /** Reset store (for testing) */
  reset(): void {
    this.store.clear();
  }
}

export function createAuthRateLimiter(env: Env): RateLimiter {
  return new RateLimiter(env.RATE_LIMIT_AUTH_MAX, env.RATE_LIMIT_WINDOW_MINUTES);
}

export function createGeneralRateLimiter(env: Env): RateLimiter {
  return new RateLimiter(env.RATE_LIMIT_GENERAL_MAX, env.RATE_LIMIT_WINDOW_MINUTES);
}
