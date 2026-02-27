// =============================================================================
// Configuration Tests — env validation, database, health check
// =============================================================================

import Database from 'better-sqlite3';
import pino from 'pino';
import { createDatabase, runMigrations, checkDatabaseHealth } from '../../src/config/database';
import { loadEnv, resetEnvCache } from '../../src/config/env';
import { createLogger } from '../../src/utils/logger';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Config: loadEnv', () => {
  beforeEach(() => {
    resetEnvCache();
  });

  it('should load valid env and return cached copy on second call', () => {
    const env1 = loadEnv();
    const env2 = loadEnv();
    expect(env1).toBe(env2); // Same reference (cached)
    expect(env1.NODE_ENV).toBe('test');
  });
});

describe('Config: Database', () => {
  it('should create file-based database with directory creation', () => {
    const logger = pino({ level: 'silent' });
    const tmpDir = path.join(os.tmpdir(), `test-db-${Date.now()}`);
    const dbPath = path.join(tmpDir, 'test.db');

    try {
      const db = createDatabase(dbPath, logger);
      expect(db).toBeDefined();
      expect(fs.existsSync(tmpDir)).toBe(true);
      db.close();
    } finally {
      // Cleanup
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup failures
      }
    }
  });

  it('should create in-memory database', () => {
    const logger = pino({ level: 'silent' });
    const db = createDatabase(':memory:', logger);
    expect(db).toBeDefined();
    db.close();
  });

  it('should run migrations successfully', () => {
    const logger = pino({ level: 'silent' });
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db, logger);

    // Check tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('tasks');
    db.close();
  });

  it('should report healthy database', () => {
    const db = new Database(':memory:');
    const result = checkDatabaseHealth(db);
    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    db.close();
  });

  it('should report unhealthy database when closed', () => {
    const db = new Database(':memory:');
    db.close();
    const result = checkDatabaseHealth(db);
    expect(result.ok).toBe(false);
  });
});

describe('Utils: createLogger', () => {
  it('should create a logger for production environment', () => {
    const env = { ...loadEnv(), NODE_ENV: 'production' as const, LOG_LEVEL: 'info' as const };
    const logger = createLogger(env);
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });

  it('should create a logger for development environment', () => {
    const env = { ...loadEnv(), NODE_ENV: 'development' as const, LOG_LEVEL: 'debug' as const };
    const logger = createLogger(env);
    expect(logger).toBeDefined();
    expect(logger.level).toBe('debug');
  });
});
