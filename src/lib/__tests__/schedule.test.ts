import { describe, expect, it } from 'vitest';
import { isBroadcastDue, weekKey } from '@/lib/schedule';

describe('schedule', () => {
  it('is due on Tuesday from 11:00 Kyiv in summer time (UTC+3)', () => {
    expect(isBroadcastDue(new Date('2026-10-20T07:59:00Z'))).toBe(false); // 10:59 Kyiv
    expect(isBroadcastDue(new Date('2026-10-20T08:00:00Z'))).toBe(true); // 11:00 Kyiv
  });

  it('is due on Tuesday from 11:00 Kyiv in winter time (UTC+2)', () => {
    expect(isBroadcastDue(new Date('2026-11-03T08:30:00Z'))).toBe(false); // 10:30 Kyiv
    expect(isBroadcastDue(new Date('2026-11-03T09:00:00Z'))).toBe(true); // 11:00 Kyiv
  });

  it('is not due on other days', () => {
    expect(isBroadcastDue(new Date('2026-10-21T09:00:00Z'))).toBe(false); // Wednesday
  });

  it('uses the Kyiv calendar for ISO weeks', () => {
    expect(weekKey(new Date('2026-10-15T09:00:00Z'))).toBe('2026-W42');
    // Sunday 23:30 UTC is already Monday in Kyiv → next week
    expect(weekKey(new Date('2026-10-18T22:30:00Z'))).toBe('2026-W43');
    expect(weekKey(new Date('2027-01-01T10:00:00Z'))).toBe('2026-W53');
  });
});
