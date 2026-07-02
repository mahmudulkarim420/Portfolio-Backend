import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { env } from './env';

/**
 * PrismaClient singleton (Prisma 7).
 *
 * Prisma 7 uses a driver adapter (`@prisma/adapter-pg`) for the runtime
 * database connection instead of the `datasource.url` in the schema.
 *
 * In development we attach the client to `globalThis` to avoid exhausting
 * database connections during hot-reloads (ts-node-dev respawns).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
