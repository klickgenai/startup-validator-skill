const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('./env');

let db = null;

/**
 * Initialize and return the SQLite database connection.
 * Uses WAL mode for better concurrent read performance.
 * Enables foreign keys enforcement.
 */
function getDatabase(dbPath) {
  if (db) return db;

  const resolvedPath = dbPath || path.resolve(config.db.path);
  const dir = path.dirname(resolvedPath);

  // Ensure the data directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    db = new Database(resolvedPath);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');

    // Enforce foreign key constraints
    db.pragma('foreign_keys = ON');

    // Run migrations
    runMigrations(db);

    return db;
  } catch (error) {
    const safeMessage = 'Failed to initialize database';
    console.error(safeMessage, { path: resolvedPath });
    throw new Error(safeMessage);
  }
}

/**
 * Run SQL migration files that haven't been applied yet.
 */
function runMigrations(database) {
  const migrationsDir = path.resolve(__dirname, '../../migrations');

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  // Create migrations table if it doesn't exist (part of 001 migration, but ensure it exists first)
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedStmt = database.prepare('SELECT name FROM migrations WHERE name = ?');
  const insertStmt = database.prepare('INSERT INTO migrations (name) VALUES (?)');

  for (const file of migrationFiles) {
    const existing = appliedStmt.get(file);
    if (existing) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    // Extract only the UP portion (before -- DOWN)
    const upSql = sql.split('-- DOWN')[0];

    try {
      database.exec(upSql);
      insertStmt.run(file);
      console.log(`Migration applied: ${file}`);
    } catch (error) {
      console.error(`Migration failed: ${file}`);
      throw new Error(`Migration failed: ${file}`);
    }
  }
}

/**
 * Close the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    try {
      db.close();
    } catch (error) {
      console.error('Error closing database');
    }
    db = null;
  }
}

/**
 * Reset the module-level db reference (used in tests).
 */
function resetDatabase() {
  db = null;
}

module.exports = { getDatabase, closeDatabase, resetDatabase };
