import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/env';
import { runHealthChecks, type HealthCheck } from '@/lib/health';
import { checkPrismaHealth } from '@/lib/prisma';

const checks: HealthCheck[] = [
  () => Promise.resolve({ name: 'app', status: 'ok' }),
  checkPrismaHealth,
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }
  const result = await runHealthChecks(checks);
  res
    .status(result.status === 'down' ? 503 : 200)
    .json({ ok: result.status !== 'down', ...result });
}
