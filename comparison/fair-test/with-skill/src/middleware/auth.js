/**
 * Authentication middleware.
 * Guardrails: #3 (auth on every endpoint), #8 (no secrets in errors)
 *
 * Verifies JWT from the Authorization header.
 * Attaches the authenticated user's ID to req.userId.
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * Require a valid JWT token on the request.
 * Usage: router.get('/protected', authenticate, handler)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. Provide a Bearer token.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  if (!token || token.trim().length === 0) {
    return sendError(res, 'Authentication required. Provide a Bearer token.', 401, 'UNAUTHORIZED');
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.userId = payload.sub;
    next();
  } catch (err) {
    // Guardrail #8: Don't leak JWT internals in the error message
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
  }
}

module.exports = { authenticate };
