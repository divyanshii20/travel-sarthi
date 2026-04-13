import { app } from './app';
import { env } from './config/env';
import { connectDatabase, closeDatabasePool } from './config/database';
import { closeRedis } from './config/redis';
import { startAlertWorker } from './modules/workers/alertWorker';
import { startCronWorkers } from './modules/workers/cronRegistry';
import { logger } from './shared/logger';

const PORT = env.PORT;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info({
        port: PORT,
        environment: env.NODE_ENV,
        url: env.API_BASE_URL,
      }, '🚀 Travel Sarthi API Server started');
    });

    // Start background workers
    if (env.NODE_ENV !== 'test') {
      startAlertWorker();
      startCronWorkers();
      logger.info('Background workers started');
    }

    // ─── Graceful Shutdown ────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutdown signal received');

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closeDatabasePool();
          await closeRedis();
          logger.info('All connections closed — goodbye!');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught exception — shutting down');
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled promise rejection');
    });

  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
