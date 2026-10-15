import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthorizedBearer } from '@/lib/admin-auth';
import { env } from '@/lib/env';
import { broadcastQuestion } from '@/server/broadcast';

/** Manual trigger of the weekly question for testing: POST with `Authorization: Bearer <ADMIN_API_SECRET>`. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end();
    return;
  }
  if (!isAuthorizedBearer(req.headers.authorization, env.ADMIN_API_SECRET)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const result = await broadcastQuestion('manual');
  res.status(200).json(result);
}
