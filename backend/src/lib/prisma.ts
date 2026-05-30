import { PrismaClient } from '@prisma/client'

/**
 * Singleton Prisma client. We attach to globalThis in development so HMR
 * doesn't open a new connection on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
