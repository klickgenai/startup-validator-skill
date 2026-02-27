/**
 * Environment configuration with validation.
 * All config flows through here — no scattered process.env reads.
 * Guardrails: #2 (no hardcoded secrets), #5 (fail fast on missing config)
 */

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  db: {
    path: process.env.DB_PATH || './data/tasks.db',
  },
};

/**
 * Validate required environment variables at startup.
 * Fails fast so we don't discover missing secrets at runtime.
 */
function validateEnv() {
  const missing = [];

  if (!config.jwt.secret) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in the values.'
    );
  }

  if (config.jwt.secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security.'
    );
  }
}

module.exports = { config, validateEnv };
