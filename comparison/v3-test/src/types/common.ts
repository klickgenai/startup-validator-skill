import { z } from 'zod';

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100)),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ---------------------------------------------------------------------------
// API Response envelopes
// ---------------------------------------------------------------------------
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Authenticated request context
// ---------------------------------------------------------------------------
export interface AuthPayload {
  userId: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Correlation ID
// ---------------------------------------------------------------------------
export interface RequestContext {
  correlationId: string;
  userId?: string;
}

// ---------------------------------------------------------------------------
// UUID schema (reusable)
// ---------------------------------------------------------------------------
export const UUIDSchema = z.string().uuid();
