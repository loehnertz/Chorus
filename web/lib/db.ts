import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error(
      'Missing database connection string. Set DATABASE_URL (or POSTGRES_URL when using a Vercel Postgres integration).',
    );
  }

  // Create or reuse pool
  const pool = globalForPrisma.pool ??
    new Pool({
      connectionString: databaseUrl,
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

  const slowMsRaw = process.env.PRISMA_SLOW_QUERY_MS
  const slowMs = slowMsRaw ? Number(slowMsRaw) : null
  const profileAll = process.env.PRISMA_PROFILE_QUERIES === '1'
  const profileEnabled = profileAll || (slowMs !== null && Number.isFinite(slowMs))

  const log: Prisma.PrismaClientOptions['log'] = (() => {
    const levels: Array<Prisma.LogLevel | Prisma.LogDefinition> = []

    if (process.env.PRISMA_LOG_QUERIES === '1') {
      levels.push({ level: 'query', emit: 'stdout' })
      levels.push('warn')
      levels.push('error')
      return levels
    }

    if (profileEnabled) {
      levels.push({ level: 'query', emit: 'event' })
    }

    if (process.env.NODE_ENV === 'development') {
      levels.push('warn')
      levels.push('error')
      return levels
    }

    levels.push('error')
    return levels
  })();

  const client = new PrismaClient({
    adapter,
    log,
  });

  // NOTE: Prisma driver-adapter clients don't support middleware ($use).
  // Use query events for profiling instead.
  if (profileEnabled) {
    client.$on('query', (e) => {
      if (!profileAll && slowMs !== null && e.duration < slowMs) return
      console.info(`prisma: ${e.target} ${e.duration.toFixed(1)}ms`)
    })
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export as db for convenience
export const db = prisma
