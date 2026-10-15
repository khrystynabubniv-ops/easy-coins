import { PrismaClient } from '@prisma/client';
import type { HealthCheckResult } from './health';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export async function checkPrismaHealth(): Promise<HealthCheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { name: 'database', status: 'ok' };
  } catch (e) {
    return {
      name: 'database',
      status: 'down',
      message: e instanceof Error ? e.message.slice(0, 100) : 'unexpected error',
    };
  }
}
