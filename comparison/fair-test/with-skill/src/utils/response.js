/**
 * Consistent API response helpers.
 * Guardrail #6: Same shape for success and error. Every list paginated.
 *
 * Success: { success: true, data: ..., meta?: { pagination } }
 * Error:   { success: false, error: { message, code } }
 */

/**
 * Send a success response with data.
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send a paginated success response.
 * Guardrail #6: Every list endpoint must be paginated.
 */
function sendPaginated(res, { items, total, page, limit }) {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: items,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
}

/**
 * Send an error response.
 * Guardrail #8: Never leak internal details or secrets in error messages.
 */
function sendError(res, message, statusCode = 400, code = 'BAD_REQUEST') {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
    },
  });
}

module.exports = { sendSuccess, sendPaginated, sendError };
