// =============================================================================
// Typed Error Classes — AppError base + domain-specific errors
// =============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// 400 — Bad Request
// ---------------------------------------------------------------------------
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

// ---------------------------------------------------------------------------
// 401 — Unauthorized
// ---------------------------------------------------------------------------
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

// ---------------------------------------------------------------------------
// 404 — Not Found (also used when ownership check fails per guardrail 4)
// ---------------------------------------------------------------------------
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

// ---------------------------------------------------------------------------
// 409 — Conflict (duplicate email, optimistic locking)
// ---------------------------------------------------------------------------
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT', true);
  }
}

// ---------------------------------------------------------------------------
// 429 — Too Many Requests
// ---------------------------------------------------------------------------
export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests, please try again later', 429, 'RATE_LIMITED', true);
  }
}

// ---------------------------------------------------------------------------
// 500 — Internal Server Error
// ---------------------------------------------------------------------------
export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}
