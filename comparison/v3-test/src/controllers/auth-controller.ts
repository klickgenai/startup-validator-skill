// =============================================================================
// Auth Controller — HTTP handlers for register/login (guardrail 5 — Zod validation)
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services';
import { RegisterSchema, LoginSchema } from '../types';
import { sendSuccess } from '../utils';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = RegisterSchema.parse(req.body);
      const result = await this.authService.register(input, req.correlationId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await this.authService.login(input, req.correlationId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
