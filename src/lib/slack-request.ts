import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '@/lib/env';
import { verifySlackSignature } from '@/lib/slack-signature';

async function readRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function header(req: NextApiRequest, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads the raw body and verifies the Slack signature.
 * Responds 405/401 itself and returns `null` when the request must not be processed.
 */
export async function readVerifiedSlackBody(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<string | null> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end();
    return null;
  }

  const rawBody = await readRawBody(req);
  const valid = verifySlackSignature({
    signingSecret: env.SLACK_SIGNING_SECRET,
    timestamp: header(req, 'x-slack-request-timestamp'),
    signature: header(req, 'x-slack-signature'),
    rawBody,
  });

  if (!valid) {
    res.status(401).json({ error: 'invalid_signature' });
    return null;
  }
  return rawBody;
}

/** Structured log line without user identifiers or message contents. */
export function logSlack(source: 'events' | 'interactions', type: string) {
  console.info(JSON.stringify({ msg: 'slack_request', source, type }));
}
