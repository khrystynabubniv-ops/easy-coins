import type { NextApiRequest, NextApiResponse } from 'next';
import { logSlack, readVerifiedSlackBody } from '@/lib/slack-request';

// The Slack signature covers the raw bytes, so Next must not parse the body.
export const config = { api: { bodyParser: false } };

interface SlackEventEnvelope {
  type?: string;
  challenge?: string;
  event?: { type?: string };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawBody = await readVerifiedSlackBody(req, res);
  if (rawBody === null) return;

  let body: SlackEventEnvelope;
  try {
    body = JSON.parse(rawBody) as SlackEventEnvelope;
  } catch {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }

  if (body.type === 'url_verification') {
    res.status(200).json({ challenge: body.challenge });
    return;
  }

  logSlack('events', body.event?.type ?? body.type ?? 'unknown');
  res.status(200).end();
}
