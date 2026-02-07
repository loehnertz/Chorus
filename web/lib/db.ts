import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  // Create or reuse pool
  const pool = globalForPrisma.pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      // In serverless environments, keep per-instance pools small to reduce the chance
      // of exhausting database connections during bursts.
      max: process.env.NODE_ENV === 'production' ? 3 : 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
      allowExitOnIdle: process.env.NODE_ENV !== 'production',
    });
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export as db for convenience
export const db = prisma
