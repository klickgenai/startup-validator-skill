// =============================================================================
// Auth Middleware — JWT verification on every protected endpoint (guardrail 4)
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/auth-service';
import { UnauthorizedError } from '../errors';

export function createAuthMiddleware(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next(new UnauthorizedError('Missing or invalid Authorization header'));
      return;
    }

    const token = authHeader.slice(7);
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
      next();
    } catch (err) {
      next(err);
    }
  };
}
