// =============================================================================
// Correlation ID Middleware — unique ID per request (guardrail 9)
// =============================================================================

import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CORRELATION_HEADER = 'x-correlation-id';

export function correlationIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const correlationId =
    (req.headers[CORRELATION_HEADER] as string | undefined) ?? randomUUID();
  req.correlationId = correlationId;
  _res.setHeader(CORRELATION_HEADER, correlationId);
  next();
}
