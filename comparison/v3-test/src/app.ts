// =============================================================================
// Express App Factory — wires all middleware, routes, and DI (guardrail 12, 15)
// =============================================================================

import express from 'express';
import type { Logger } from 'pino';
import type Database from 'better-sqlite3';
import type { Env } from './config';
import { runMigrations } from './config';
import { EventBus, createAuditLogHandler } from './events';
import { SqliteUserRepository, SqliteTaskRepository } from './repositories';
import { AuthService, TaskService } from './services';
import { AuthController, TaskController, HealthController } from './controllers';
import {
  correlationIdMiddleware,
  securityHeadersMiddleware,
  createAuthRateLimiter,
  createGeneralRateLimiter,
  createAuthMiddleware,
  createErrorHandler,
} from './middleware';

export interface AppDependencies {
  db: Database.Database;
  logger: Logger;
  env: Env;
}

export function createApp(deps: AppDependencies) {
  const { db, logger, env } = deps;

  // Run migrations
  runMigrations(db, logger);

  // ---------------------------------------------------------------------------
  // Event bus + audit log handler
  // ---------------------------------------------------------------------------
  const eventBus = new EventBus(logger);
  eventBus.on('user.created', createAuditLogHandler(logger));
  eventBus.on('task.created', createAuditLogHandler(logger));
  eventBus.on('task.updated', createAuditLogHandler(logger));
  eventBus.on('task.deleted', createAuditLogHandler(logger));

  // ---------------------------------------------------------------------------
  // Repositories (guardrail 13)
  // ---------------------------------------------------------------------------
  const userRepo = new SqliteUserRepository(db);
  const taskRepo = new SqliteTaskRepository(db);

  // ---------------------------------------------------------------------------
  // Services (guardrail 12 — dependency injection)
  // ---------------------------------------------------------------------------
  const authService = new AuthService({ userRepo, eventBus, env, logger });
  const taskService = new TaskService({ taskRepo, eventBus, logger });

  // ---------------------------------------------------------------------------
  // Controllers
  // ---------------------------------------------------------------------------
  const authController = new AuthController(authService);
  const taskController = new TaskController(taskService);
  const healthController = new HealthController(db);

  // ---------------------------------------------------------------------------
  // Rate limiters (guardrail 16)
  // ---------------------------------------------------------------------------
  const authRateLimiter = createAuthRateLimiter(env);
  const generalRateLimiter = createGeneralRateLimiter(env);

  // ---------------------------------------------------------------------------
  // Auth middleware
  // ---------------------------------------------------------------------------
  const authMiddleware = createAuthMiddleware(authService);

  // ---------------------------------------------------------------------------
  // Express app
  // ---------------------------------------------------------------------------
  const app = express();

  // Global middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(correlationIdMiddleware);
  app.use(securityHeadersMiddleware);

  // Health check (no rate limit, no auth)
  app.get('/health', healthController.check);

  // Auth routes (stricter rate limit)
  app.post('/api/v1/auth/register', authRateLimiter.middleware(), authController.register);
  app.post('/api/v1/auth/login', authRateLimiter.middleware(), authController.login);

  // Task routes (general rate limit + auth)
  app.post('/api/v1/tasks', generalRateLimiter.middleware(), authMiddleware, taskController.create);
  app.get('/api/v1/tasks', generalRateLimiter.middleware(), authMiddleware, taskController.list);
  app.get('/api/v1/tasks/:id', generalRateLimiter.middleware(), authMiddleware, taskController.getById);
  app.put('/api/v1/tasks/:id', generalRateLimiter.middleware(), authMiddleware, taskController.update);
  app.delete('/api/v1/tasks/:id', generalRateLimiter.middleware(), authMiddleware, taskController.delete);

  // Global error handler (must be last)
  app.use(createErrorHandler(logger));

  return { app, authRateLimiter, generalRateLimiter };
}
