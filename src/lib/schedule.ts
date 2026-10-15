export const TIME_ZONE = 'Europe/Kyiv';
/** Weekly broadcast: Tuesday 11:00 Kyiv time. */
export const BROADCAST_WEEKDAY = 2; // ISO: Monday = 1
export const BROADCAST_HOUR = 11;

interface KyivParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  isoWeekday: number;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function kyivParts(date: Date): KyivParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    isoWeekday: WEEKDAYS.indexOf(get('weekday')) + 1,
  };
}

/** ISO-8601 week of the Kyiv calendar date, e.g. `2026-W42`. */
export function weekKey(date: Date): string {
  const { year, month, day } = kyivParts(date);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday of this week decides the year
  const isoYear = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(isoYear, 0, 1)) / 86_400_000 + 1) / 7);
  return `${String(isoYear)}-W${String(week).padStart(2, '0')}`;
}

/** True from Tuesday 11:00 Kyiv until the end of that Tuesday (lets a restart catch up). */
export function isBroadcastDue(date: Date): boolean {
  const { isoWeekday, hour } = kyivParts(date);
  return isoWeekday === BROADCAST_WEEKDAY && hour >= BROADCAST_HOUR;
}
