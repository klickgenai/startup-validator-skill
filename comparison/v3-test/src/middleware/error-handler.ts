// =============================================================================
// Global Error Handler Middleware (guardrail 6)
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';
import { AppError } from '../errors';
import { ZodError } from 'zod';

export function createErrorHandler(logger: Logger) {
  const log = logger.child({ component: 'ErrorHandler' });

  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    const correlationId = req.correlationId ?? 'unknown';

    if (err instanceof AppError) {
      if (!err.isOperational) {
        log.error({ err, correlationId }, 'Non-operational error');
      } else {
        log.warn({ err: { message: err.message, code: err.code }, correlationId }, 'Operational error');
      }

      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined && { details: err.details }),
        },
      });
      return;
    }

    if (err instanceof ZodError) {
      log.warn({ correlationId, issues: err.issues }, 'Validation error');
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      });
      return;
    }

    // Unexpected error — log full stack but return generic message
    log.error({ err, correlationId }, 'Unhandled error');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  };
}
