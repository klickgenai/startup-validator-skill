/**
 * Global error handling middleware.
 * Guardrails: #5 (error handling on every external call), #8 (no secrets in logs/errors)
 *
 * Catches unhandled errors and returns a safe, consistent response.
 * Internal details are logged server-side but never sent to the client.
 */

const { sendError } = require('../utils/response');

/**
 * Express error-handling middleware (4 arguments required).
 */
function globalErrorHandler(err, req, res, _next) {
  // Log the full error server-side for debugging (never to client)
  console.error(`[ERROR] ${req.method} ${req.path}:`, {
    message: err.message,
    // Don't log stack in production to avoid filling logs
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Handle specific known error types
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Invalid JSON in request body.', 400, 'INVALID_JSON');
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return sendError(res, 'A record with that value already exists.', 409, 'DUPLICATE');
  }

  // Default: Internal Server Error — never leak internals to client
  return sendError(
    res,
    'An unexpected error occurred. Please try again later.',
    500,
    'INTERNAL_ERROR'
  );
}

module.exports = { globalErrorHandler };
