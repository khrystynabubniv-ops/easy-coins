import { createHash, timingSafeEqual } from 'node:crypto';

/** Timing-safe check of an `Authorization: Bearer <secret>` header. */
export function isAuthorizedBearer(header: string | undefined, secret: string): boolean {
  if (!header?.startsWith('Bearer ') || !secret) return false;
  const digest = (v: string) => createHash('sha256').update(v).digest();
  return timingSafeEqual(digest(header.slice('Bearer '.length)), digest(secret));
}
