// =============================================================================
// Health Check Controller — reports DB latency and dependency status (guardrail 9)
// =============================================================================

import type { Request, Response } from 'express';
import type Database from 'better-sqlite3';
import { checkDatabaseHealth } from '../config';

export class HealthController {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  check = (_req: Request, res: Response): void => {
    const dbHealth = checkDatabaseHealth(this.db);

    const status = dbHealth.ok ? 'healthy' : 'degraded';
    const statusCode = dbHealth.ok ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: {
          status: dbHealth.ok ? 'up' : 'down',
          latencyMs: dbHealth.latencyMs,
        },
      },
    });
  };
}
