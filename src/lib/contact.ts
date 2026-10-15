export type ContactType = 'LINKEDIN' | 'TELEGRAM';

export interface ParsedContact {
  type: ContactType;
  /** Normalised key for duplicate detection, e.g. `linkedin:jane-doe`. */
  key: string;
}

const LINKEDIN = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([^/?#\s]+)\/?(?:[?#].*)?$/i;
const TELEGRAM_URL = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{5,32})\/?$/i;
const TELEGRAM_HANDLE = /^@([A-Za-z0-9_]{5,32})$/;

/** Accepts linkedin.com/in/…, t.me/… or @username. Returns null when unrecognised. */
export function parseContact(input: string): ParsedContact | null {
  const value = input.trim();

  const linkedin = LINKEDIN.exec(value);
  if (linkedin?.[1]) {
    let slug = linkedin[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // keep the raw slug when it is not valid percent-encoding
    }
    return { type: 'LINKEDIN', key: `linkedin:${slug.toLowerCase()}` };
  }

  const telegram = TELEGRAM_URL.exec(value) ?? TELEGRAM_HANDLE.exec(value);
  if (telegram?.[1]) {
    return { type: 'TELEGRAM', key: `telegram:${telegram[1].toLowerCase()}` };
  }

  return null;
}
