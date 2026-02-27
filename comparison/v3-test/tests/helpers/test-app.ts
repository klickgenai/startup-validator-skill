// =============================================================================
// Test App Helper — creates isolated app instance per test suite
// =============================================================================

import type { Express } from 'express';
import Database from 'better-sqlite3';
import pino from 'pino';
import { loadEnv, resetEnvCache } from '../../src/config';
import { createApp } from '../../src/app';
import type { RateLimiter } from '../../src/middleware/rate-limiter';

export interface TestApp {
  app: Express;
  db: Database.Database;
  authRateLimiter: RateLimiter;
  generalRateLimiter: RateLimiter;
  cleanup: () => void;
}

export function createTestApp(): TestApp {
  resetEnvCache();
  const env = loadEnv();
  const logger = pino({ level: 'silent' });
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  const { app, authRateLimiter, generalRateLimiter } = createApp({ db, logger, env });

  return {
    app,
    db,
    authRateLimiter,
    generalRateLimiter,
    cleanup: () => {
      db.close();
      resetEnvCache();
    },
  };
}
