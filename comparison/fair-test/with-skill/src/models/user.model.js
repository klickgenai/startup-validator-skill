/**
 * User model — all database operations for users.
 * Guardrails: #1 (parameterized queries), #7 (DB integrity), #8 (never return password_hash)
 */

const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');

const SALT_ROUNDS = 12;

/**
 * Create a new user.
 * Returns the user object WITHOUT password_hash.
 * Throws if email already exists (UNIQUE constraint).
 */
function createUser(email, password) {
  const db = getDatabase();
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash)
    VALUES (?, ?)
  `);

  const result = stmt.run(email.trim().toLowerCase(), passwordHash);

  return {
    id: result.lastInsertRowid,
    email: email.trim().toLowerCase(),
  };
}

/**
 * Find a user by email. Returns full record including password_hash
 * (needed for login verification — caller must NOT expose hash).
 */
function findByEmail(email) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.trim().toLowerCase());
}

/**
 * Find a user by ID. Returns user WITHOUT password_hash (safe for responses).
 */
function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id, email, created_at, updated_at FROM users WHERE id = ?');
  return stmt.get(id);
}

/**
 * Verify a password against a hash.
 */
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = { createUser, findByEmail, findById, verifyPassword };
