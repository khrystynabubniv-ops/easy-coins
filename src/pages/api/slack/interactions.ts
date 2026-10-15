import type { NextApiRequest, NextApiResponse } from 'next';
import { logSlack, readVerifiedSlackBody } from '@/lib/slack-request';
import { handleInteraction, type InteractionPayload } from '@/server/interactions';
import { SlackApiError } from '@/server/slack-api';

// The Slack signature covers the raw bytes, so Next must not parse the body.
export const config = { api: { bodyParser: false } };

function logError(stage: string, e: unknown) {
  console.error(
    JSON.stringify({
      msg: 'slack_interaction_failed',
      stage,
      error:
        e instanceof SlackApiError
          ? e.code
          : e instanceof Error
            ? e.message.slice(0, 100)
            : 'unexpected',
    }),
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawBody = await readVerifiedSlackBody(req, res);
  if (rawBody === null) return;

  let payload: InteractionPayload;
  try {
    payload = JSON.parse(new URLSearchParams(rawBody).get('payload') ?? '') as InteractionPayload;
  } catch {
    logSlack('interactions', 'invalid_payload');
    res.status(400).end();
    return;
  }
  logSlack('interactions', payload.type);

  // Slack expects an acknowledgement within 3 seconds; follow-up messages are sent after it.
  try {
    const outcome = await handleInteraction(payload);
    if (outcome.body === undefined) res.status(200).end();
    else res.status(200).json(outcome.body);
    if (outcome.after)
      await outcome.after().catch((e: unknown) => {
        logError('after', e);
      });
  } catch (e) {
    logError('handle', e);
    if (!res.headersSent) res.status(200).end();
  }
}
