import { describe, expect, it } from 'vitest';
import {
  MAX_REQUEST_AGE_SECONDS,
  computeSlackSignature,
  verifySlackSignature,
} from '@/lib/slack-signature';

const signingSecret = 'test-signing-secret';
const rawBody = 'token=abc&team_id=T1&payload=%7B%22type%22%3A%22block_actions%22%7D';
const nowSeconds = 1_760_000_000;
const now = nowSeconds * 1000;
const timestamp = String(nowSeconds);

describe('verifySlackSignature', () => {
  it('accepts a valid signature', () => {
    const signature = computeSlackSignature(signingSecret, timestamp, rawBody);
    expect(verifySlackSignature({ signingSecret, timestamp, signature, rawBody, now })).toBe(true);
  });

  it('rejects an invalid signature', () => {
    const signature = computeSlackSignature('wrong-secret', timestamp, rawBody);
    expect(verifySlackSignature({ signingSecret, timestamp, signature, rawBody, now })).toBe(false);
  });

  it('rejects a signature for a tampered body', () => {
    const signature = computeSlackSignature(signingSecret, timestamp, rawBody);
    expect(
      verifySlackSignature({ signingSecret, timestamp, signature, rawBody: `${rawBody}x`, now }),
    ).toBe(false);
  });

  it('rejects an expired timestamp even with a correct signature', () => {
    const old = String(nowSeconds - MAX_REQUEST_AGE_SECONDS - 1);
    const signature = computeSlackSignature(signingSecret, old, rawBody);
    expect(verifySlackSignature({ signingSecret, timestamp: old, signature, rawBody, now })).toBe(
      false,
    );
  });

  it('rejects missing headers', () => {
    expect(
      verifySlackSignature({
        signingSecret,
        timestamp: undefined,
        signature: undefined,
        rawBody,
        now,
      }),
    ).toBe(false);
  });
});
