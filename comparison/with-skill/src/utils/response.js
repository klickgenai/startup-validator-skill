/**
 * Consistent API response helpers.
 * Every response from this API uses the same shape:
 *
 * Success: { success: true, data: { ... }, meta?: { ... } }
 * Error:   { success: false, error: { code: '...', message: '...', details?: [...] } }
 *
 * This ensures clients can always check `response.success` first.
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {object} data - The payload
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {object} meta - Optional metadata (pagination, etc.)
 */
function success(res, data, statusCode = 200, meta = null) {
  const response = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable message
 * @param {Array} details - Optional validation error details
 */
function error(res, statusCode, code, message, details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
}

module.exports = { success, error };
