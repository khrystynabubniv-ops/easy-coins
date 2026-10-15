import { env } from '@/lib/env';

export class SlackApiError extends Error {
  constructor(
    readonly method: string,
    readonly code: string,
  ) {
    super(`Slack ${method} failed: ${code}`);
  }
}

/** Minimal Slack Web API client. Errors carry only the method and Slack's error code. */
export async function slackApi<T = Record<string, unknown>>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; error?: string } & T;
  if (!json.ok) throw new SlackApiError(method, json.error ?? `http_${String(res.status)}`);
  return json;
}

export async function openDm(userId: string): Promise<string> {
  const { channel } = await slackApi<{ channel: { id: string } }>('conversations.open', {
    users: userId,
  });
  return channel.id;
}

export async function postMessage(
  channel: string,
  message: { text: string; blocks?: unknown[] },
  threadTs?: string,
): Promise<string> {
  const { ts } = await slackApi<{ ts: string }>('chat.postMessage', {
    channel,
    ...message,
    ...(threadTs ? { thread_ts: threadTs } : {}),
  });
  return ts;
}
