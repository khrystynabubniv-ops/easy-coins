import type { NextApiRequest, NextApiResponse } from 'next';
import { logSlack, readVerifiedSlackBody } from '@/lib/slack-request';

// The Slack signature covers the raw bytes, so Next must not parse the body.
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawBody = await readVerifiedSlackBody(req, res);
  if (rawBody === null) return;

  let type = 'unknown';
  try {
    const payload = new URLSearchParams(rawBody).get('payload');
    if (payload) type = (JSON.parse(payload) as { type?: string }).type ?? 'unknown';
  } catch {
    type = 'invalid_payload';
  }

  // Slack expects an acknowledgement within 3 seconds; real handling comes later.
  res.status(200).end();
  logSlack('interactions', type);
}
