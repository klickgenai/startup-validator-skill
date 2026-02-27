// =============================================================================
// Consistent API Response Helpers (guardrail 7)
// =============================================================================

import type { Response } from 'express';
import type { ApiSuccessResponse, ApiErrorResponse, PaginationMeta } from '../types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200,
): void {
  const body: ApiSuccessResponse<T[]> = { success: true, data, meta };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number,
  details?: unknown,
): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, ...(details !== undefined && { details }) },
  };
  res.status(statusCode).json(body);
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
