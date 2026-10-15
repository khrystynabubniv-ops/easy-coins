export type ContactType = 'LINKEDIN' | 'TELEGRAM' | 'OTHER';

export interface ParsedContact {
  type: ContactType;
  /** Normalised key for duplicate detection, e.g. `linkedin:jane-doe` or `url:instagram.com/jane`. */
  key: string;
}

const LINKEDIN = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([^/?#\s]+)\/?(?:[?#].*)?$/i;
const TELEGRAM_URL = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{5,32})\/?$/i;
const TELEGRAM_HANDLE = /^@([A-Za-z0-9_]{5,32})$/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Any http(s) link, with or without the scheme, e.g. `instagram.com/jane`. */
function parseLink(value: string): ParsedContact | null {
  if (/\s/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(host)) return null;
  const path = safeDecode(url.pathname).replace(/\/+$/, '').toLowerCase();
  return { type: 'OTHER', key: `url:${host}${path}` };
}

/**
 * Accepts a LinkedIn profile, Telegram (t.me/… or @username) or any other link
 * (Instagram, GitHub, …). Returns null when it is none of these.
 */
export function parseContact(input: string): ParsedContact | null {
  const value = input.trim();

  const linkedin = LINKEDIN.exec(value);
  if (linkedin?.[1]) {
    return { type: 'LINKEDIN', key: `linkedin:${safeDecode(linkedin[1]).toLowerCase()}` };
  }

  const telegram = TELEGRAM_URL.exec(value) ?? TELEGRAM_HANDLE.exec(value);
  if (telegram?.[1]) {
    return { type: 'TELEGRAM', key: `telegram:${telegram[1].toLowerCase()}` };
  }

  return parseLink(value);
}
