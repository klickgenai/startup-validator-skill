const path = require('path');
const dotenv = require('dotenv');

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredVars = ['JWT_SECRET'];

function validateEnv() {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in the values.'
    );
  }
}

// Only validate in non-test environments; tests set their own values
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'test-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  db: {
    path: process.env.DB_PATH || './data/tasks.db',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  authRateLimit: {
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 20,
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
};

module.exports = config;
