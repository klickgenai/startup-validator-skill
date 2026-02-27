// =============================================================================
// Test Setup — runs before each test suite
// =============================================================================

// Set test environment variables before anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-jwt';
process.env.DATABASE_PATH = ':memory:';
process.env.LOG_LEVEL = 'fatal';
process.env.PORT = '3333';
process.env.RATE_LIMIT_GENERAL_MAX = '1000';
process.env.RATE_LIMIT_AUTH_MAX = '1000';
process.env.RATE_LIMIT_WINDOW_MINUTES = '15';
