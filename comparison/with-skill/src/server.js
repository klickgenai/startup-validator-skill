const { createApp } = require('./app');
const { getDatabase, closeDatabase } = require('./config/database');
const config = require('./config/env');

// ─── Initialize database ────────────────────────────────────────────────────
try {
  getDatabase();
  console.log('Database initialized successfully');
} catch (err) {
  console.error('Failed to initialize database. Exiting.');
  process.exit(1);
}

// ─── Start server ────────────────────────────────────────────────────────────
const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

// ─── Graceful shutdown ──────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('HTTP server closed');
    closeDatabase();
    console.log('Database connection closed');
    process.exit(0);
  });

  // Force shutdown after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Prevent unhandled rejections from crashing the process silently
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

module.exports = server;
