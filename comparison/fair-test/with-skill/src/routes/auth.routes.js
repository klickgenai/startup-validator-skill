/**
 * Auth routes — registration and login.
 * Guardrails: #1, #2, #4, #5, #6, #8
 *
 * POST /api/auth/register — create a new account
 * POST /api/auth/login    — authenticate and receive a JWT
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { createUser, findByEmail, verifyPassword } = require('../models/user.model');
const { validateRegister, validateLogin } = require('../validators/auth.validators');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

/**
 * Generate a JWT for a user.
 * Payload contains only the user ID (sub) — no sensitive data.
 */
function generateToken(userId) {
  return jwt.sign(
    { sub: userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * POST /api/auth/register
 * Creates a new user and returns a JWT.
 */
router.post('/register', (req, res, next) => {
  try {
    // Guardrail #4: Validate input
    const validation = validateRegister(req.body);
    if (!validation.valid) {
      return sendError(res, validation.errors.join(' '), 400, 'VALIDATION_ERROR');
    }

    // Check if email is already taken
    const existing = findByEmail(req.body.email);
    if (existing) {
      return sendError(res, 'An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    // Create the user (password is hashed in the model layer)
    const user = createUser(req.body.email, req.body.password);
    const token = generateToken(user.id);

    return sendSuccess(res, {
      user: { id: user.id, email: user.email },
      token,
    }, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 * Guardrail #8: Generic error message — don't reveal whether email exists.
 */
router.post('/login', (req, res, next) => {
  try {
    // Guardrail #4: Validate input
    const validation = validateLogin(req.body);
    if (!validation.valid) {
      return sendError(res, validation.errors.join(' '), 400, 'VALIDATION_ERROR');
    }

    const user = findByEmail(req.body.email);

    // Guardrail #8: Same error message for wrong email or wrong password
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const passwordValid = verifyPassword(req.body.password, user.password_hash);
    if (!passwordValid) {
      return sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user.id);

    return sendSuccess(res, {
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
