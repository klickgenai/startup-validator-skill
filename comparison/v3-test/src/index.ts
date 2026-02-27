// =============================================================================
// Entry Point — bootstrap and start (guardrail 3: crash on missing env)
// =============================================================================

import { loadEnv } from './config';
import { createDatabase } from './config';
import { createLogger } from './utils';
import { createApp } from './app';

function main(): void {
  const env = loadEnv();
  const logger = createLogger(env);
  const db = createDatabase(env.DATABASE_PATH, logger);

  const { app } = createApp({ db, logger, env });

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    server.close(() => {
      db.close();
      logger.info('Server closed gracefully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
