import { defineConfig } from 'prisma/config';

import { env } from './src/config/env';

/**
 * Prisma 7 configuration.
 *
 * The connection URL is no longer declared in `schema.prisma`; instead it is
 * supplied here (for migrations/introspection) and in `src/config/prisma.ts`
 * (for the runtime client via the `@prisma/adapter-pg` driver adapter).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env.DATABASE_URL,
  },
});
