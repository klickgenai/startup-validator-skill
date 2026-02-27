/**
 * Server entry point.
 * Initializes environment, database, and starts the Express server.
 *
 * Guardrails: #2 (env validation at startup), #5 (fail fast on config errors)
 */

const { config, validateEnv } = require('./config/env');
const { initDatabase } = require('./config/database');
const app = require('./app');

// Guardrail #2 & #5: Validate environment before anything else
validateEnv();

// Initialize the database (creates tables if they don't exist)
initDatabase();

const server = app.listen(config.port, () => {
  console.log(`Task Management API running on port ${config.port} [${config.nodeEnv}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    const { closeDatabase } = require('./config/database');
    closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    const { closeDatabase } = require('./config/database');
    closeDatabase();
    process.exit(0);
  });
});
