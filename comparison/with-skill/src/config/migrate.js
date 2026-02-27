/**
 * Standalone migration runner.
 * Usage: node src/config/migrate.js
 */
const { getDatabase, closeDatabase } = require('./database');

try {
  console.log('Running migrations...');
  getDatabase();
  console.log('Migrations complete.');
} catch (error) {
  console.error('Migration error:', error.message);
  process.exit(1);
} finally {
  closeDatabase();
}
