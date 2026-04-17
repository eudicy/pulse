import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prismaRaw: PrismaClient }

export const dbRaw =
  globalForPrisma.prismaRaw ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaRaw = dbRaw
