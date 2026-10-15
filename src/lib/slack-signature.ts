import { createHmac, timingSafeEqual } from 'node:crypto';

/** Slack recommends rejecting requests older than five minutes to prevent replay attacks. */
export const MAX_REQUEST_AGE_SECONDS = 60 * 5;

export interface VerifySlackSignatureInput {
  signingSecret: string;
  /** Value of the `X-Slack-Request-Timestamp` header (unix seconds). */
  timestamp: string | undefined;
  /** Value of the `X-Slack-Signature` header, e.g. `v0=abc123…`. */
  signature: string | undefined;
  /** The raw, unparsed request body exactly as Slack sent it. */
  rawBody: string;
  /** Current time in milliseconds; injectable for tests. */
  now?: number;
}

export function computeSlackSignature(signingSecret: string, timestamp: string, rawBody: string) {
  const digest = createHmac('sha256', signingSecret)
    .update(`v0:${timestamp}:${rawBody}`)
    .digest('hex');
  return `v0=${digest}`;
}

export function verifySlackSignature({
  signingSecret,
  timestamp,
  signature,
  rawBody,
  now = Date.now(),
}: VerifySlackSignatureInput): boolean {
  if (!signingSecret || !timestamp || !signature) return false;
  if (!/^\d+$/.test(timestamp)) return false;

  const ageSeconds = Math.abs(Math.floor(now / 1000) - Number(timestamp));
  if (ageSeconds > MAX_REQUEST_AGE_SECONDS) return false;

  const expected = Buffer.from(computeSlackSignature(signingSecret, timestamp, rawBody), 'utf8');
  const received = Buffer.from(signature, 'utf8');
  if (expected.length !== received.length) return false;

  return timingSafeEqual(expected, received);
}
