const express = require('express');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

/**
 * Create and configure the Express application.
 * Exported as a factory so tests can create isolated instances.
 */
function createApp() {
  const app = express();

  // ─── Security headers ──────────────────────────────────────────────────
  app.use(helmet());

  // ─── Body parsing (with size limit to prevent payload bombs) ───────────
  app.use(express.json({ limit: '10kb' }));

  // ─── General rate limiting ─────────────────────────────────────────────
  app.use(generalLimiter);

  // ─── Health check (unauthenticated, for load balancers / uptime checks) ─
  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  // ─── Routes ────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);

  // ─── 404 handler for undefined routes ──────────────────────────────────
  app.use(notFoundHandler);

  // ─── Global error handler (must be last) ───────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
