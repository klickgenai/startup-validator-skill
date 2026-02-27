const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Authentication middleware.
 * Verifies the JWT token from the Authorization header.
 * Attaches the decoded user payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Provide a valid Bearer token.',
      },
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!token || token.trim() === '') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Provide a valid Bearer token.',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please log in again.',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token.',
      },
    });
  }
}

module.exports = { authenticate };
