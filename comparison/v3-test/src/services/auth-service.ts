// =============================================================================
// Auth Service — business logic for registration and login (guardrails 4, 12)
// =============================================================================

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { Logger } from 'pino';
import type { IUserRepository } from '../repositories';
import type { EventBus } from '../events';
import type { Env } from '../config';
import type { RegisterInput, LoginInput, AuthResponse, UserPublic, AuthPayload } from '../types';
import { ConflictError, UnauthorizedError } from '../errors';

const BCRYPT_ROUNDS = 12;

export class AuthService {
  private readonly userRepo: IUserRepository;
  private readonly eventBus: EventBus;
  private readonly env: Env;
  private readonly logger: Logger;

  constructor(deps: {
    userRepo: IUserRepository;
    eventBus: EventBus;
    env: Env;
    logger: Logger;
  }) {
    this.userRepo = deps.userRepo;
    this.eventBus = deps.eventBus;
    this.env = deps.env;
    this.logger = deps.logger.child({ service: 'AuthService' });
  }

  async register(input: RegisterInput, correlationId: string): Promise<AuthResponse> {
    this.logger.info({ email: input.email, correlationId }, 'Registering new user');

    if (this.userRepo.existsByEmail(input.email)) {
      throw new ConflictError('Email already registered');
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      id: randomUUID(),
      email: input.email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const token = this.generateToken({ userId: user.id, email: user.email });
    const userPublic = this.toPublic(user);

    await this.eventBus.emit({
      type: 'user.created',
      payload: {
        action: 'CREATE',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        correlationId,
        timestamp: now,
      },
    });

    return { user: userPublic, token };
  }

  async login(input: LoginInput, correlationId: string): Promise<AuthResponse> {
    this.logger.info({ email: input.email, correlationId }, 'User login attempt');

    const user = this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken({ userId: user.id, email: user.email });
    return { user: this.toPublic(user), token };
  }

  verifyToken(token: string): AuthPayload {
    try {
      const decoded = jwt.verify(token, this.env.JWT_SECRET) as AuthPayload;
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  private generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.env.JWT_SECRET, {
      expiresIn: this.env.JWT_EXPIRES_IN as StringValue,
    });
  }

  private toPublic(user: { id: string; email: string; createdAt: string; updatedAt: string }): UserPublic {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
