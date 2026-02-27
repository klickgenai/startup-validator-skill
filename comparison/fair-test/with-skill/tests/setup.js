/**
 * Test setup — initializes an in-memory SQLite database for each test suite.
 * Ensures tests are isolated and don't touch any real data.
 */

// Set environment variables BEFORE importing any app code
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

const { initDatabase, closeDatabase } = require('../src/config/database');

/**
 * Initialize a fresh in-memory database for testing.
 * Call this in beforeAll() or beforeEach() as needed.
 */
function setupTestDatabase() {
  return initDatabase(':memory:');
}

/**
 * Close the test database.
 * Call this in afterAll().
 */
function teardownTestDatabase() {
  closeDatabase();
}

module.exports = { setupTestDatabase, teardownTestDatabase };
