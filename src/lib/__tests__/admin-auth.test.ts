import { describe, expect, it } from 'vitest';
import { isAuthorizedBearer } from '@/lib/admin-auth';

const secret = 'x'.repeat(40);

describe('isAuthorizedBearer', () => {
  it('accepts the right secret', () => {
    expect(isAuthorizedBearer(`Bearer ${secret}`, secret)).toBe(true);
  });
  it('rejects a wrong or missing secret', () => {
    expect(isAuthorizedBearer('Bearer nope', secret)).toBe(false);
    expect(isAuthorizedBearer(undefined, secret)).toBe(false);
    expect(isAuthorizedBearer(secret, secret)).toBe(false);
  });
});
