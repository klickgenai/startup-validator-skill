/**
 * Express application setup.
 * Separated from server startup for testability (supertest needs the app, not a running server).
 *
 * Guardrails applied:
 * #4 - JSON body parsing with size limit (prevents payload abuse)
 * #5 - Global error handler catches unhandled errors
 * #6 - Consistent API response shapes throughout
 * #8 - No secrets or stack traces leaked in error responses
 */

const express = require('express');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const { globalErrorHandler } = require('./middleware/error');
const { sendError } = require('./utils/response');

const app = express();

// ── Body parsing with size limit ──
// Guardrail #4: Prevent oversized payloads (default 100kb is fine for this API)
app.use(express.json({ limit: '100kb' }));

// ── Security headers ──
app.use((_req, res, next) => {
  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// ── Health check (no auth required) ──
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ── 404 handler for undefined routes ──
app.use((_req, res) => {
  sendError(res, 'Route not found.', 404, 'NOT_FOUND');
});

// ── Global error handler (must be last) ──
app.use(globalErrorHandler);

module.exports = app;
