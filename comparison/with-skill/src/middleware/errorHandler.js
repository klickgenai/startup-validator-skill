/**
 * Global error handler middleware.
 * - Never exposes stack traces or internal details to clients.
 * - Logs errors server-side for debugging.
 * - Returns consistent error response shape.
 */
function errorHandler(err, req, res, _next) {
  // Log the error internally (no sensitive data)
  console.error('Unhandled error:', {
    method: req.method,
    path: req.path,
    message: err.message,
    // Stack only in development, never sent to client
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Never expose internal error details to the client
  const clientMessage =
    statusCode < 500
      ? err.message
      : 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: clientMessage,
    },
  });
}

/**
 * 404 handler for undefined routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
