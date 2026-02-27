/**
 * Database configuration and initialization.
 * Guardrails: #1 (parameterized queries), #7 (full DB integrity), #9 (WAL mode for concurrency)
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { config } = require('./env');

let db = null;

/**
 * Initialize the database connection and create tables.
 * Uses WAL mode for better concurrent read performance.
 * All constraints enforced from the first table.
 */
function initDatabase(dbPath) {
  const resolvedPath = dbPath || config.db.path;
  const dir = path.dirname(resolvedPath);

  // Ensure data directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enforce foreign key constraints
  db.pragma('foreign_keys = ON');

  // Create tables with full integrity constraints
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Index for fast lookup of tasks by user (the most common query pattern)
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

    -- Composite index for filtered queries (user + status, user + priority)
    CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, priority);
  `);

  return db;
}

/**
 * Get the database instance. Throws if not initialized.
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { initDatabase, getDatabase, closeDatabase };
