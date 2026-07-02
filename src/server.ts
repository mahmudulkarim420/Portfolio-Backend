import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

/**
 * HTTP server bootstrap (README §8: `server.ts`).
 *
 * Starts the Express app on the configured PORT and verifies the database
 * connection before listening.
 */
async function startServer(): Promise<void> {
  const app = createApp();
  const port = env.PORT;

  // Verify the database connection before accepting traffic.
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   API base:    /api`);
  });

  // Graceful shutdown — close the DB connection on termination signals.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('💤 Database disconnected. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
