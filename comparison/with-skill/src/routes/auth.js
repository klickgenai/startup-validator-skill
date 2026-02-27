const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { success, error } = require('../utils/response');
const { getDatabase } = require('../config/database');
const config = require('../config/env');

const router = express.Router();

// ─── Validation Schemas ─────────────────────────────────────────────────────

const registerSchema = {
  body: {
    email: {
      type: 'string',
      required: true,
      maxLength: 255,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'email must be a valid email address',
      sanitize: (v) => v.trim().toLowerCase(),
    },
    password: {
      type: 'string',
      required: true,
      minLength: 8,
      maxLength: 128,
    },
    name: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100,
      sanitize: (v) => v.trim(),
    },
  },
};

const loginSchema = {
  body: {
    email: {
      type: 'string',
      required: true,
      maxLength: 255,
      sanitize: (v) => v.trim().toLowerCase(),
    },
    password: {
      type: 'string',
      required: true,
      maxLength: 128,
    },
  },
};

// ─── Helper: generate JWT ───────────────────────────────────────────────────

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// ─── POST /api/auth/register ────────────────────────────────────────────────
// Checklist: input validation [x], rate limiting [x], parameterized SQL [x],
// error handling [x], consistent response shape [x], no secrets in logs [x]

router.post('/register', authLimiter, validate(registerSchema), (req, res) => {
  const { email, password, name } = req.body;

  try {
    const db = getDatabase();

    // Check for existing user (parameterized query)
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return error(res, 409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    // Hash password (never store plaintext)
    const passwordHash = bcrypt.hashSync(password, config.bcrypt.saltRounds);

    const id = uuidv4();
    const now = new Date().toISOString();

    // Insert user (parameterized query)
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, email, passwordHash, name, now, now);

    const token = generateToken({ id, email });

    return success(
      res,
      {
        user: { id, email, name, created_at: now },
        token,
      },
      201
    );
  } catch (err) {
    console.error('Registration error:', { email: '***' });
    return error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.');
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────
// Checklist: input validation [x], rate limiting [x], parameterized SQL [x],
// error handling [x], consistent response shape [x], no secrets in logs [x]

router.post('/login', authLimiter, validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  try {
    const db = getDatabase();

    // Find user by email (parameterized query)
    const user = db.prepare('SELECT id, email, password_hash, name FROM users WHERE email = ?').get(email);

    if (!user) {
      // Deliberately vague message — don't reveal whether the email exists
      return error(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Compare password (constant-time via bcrypt)
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return error(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = generateToken(user);

    return success(res, {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error('Login error:', { email: '***' });
    return error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.');
  }
});

module.exports = router;
