import { describe, expect, it } from 'vitest';
import { parseContact } from '@/lib/contact';

describe('parseContact', () => {
  it.each([
    ['https://www.linkedin.com/in/Jane-Doe/', 'linkedin:jane-doe'],
    ['linkedin.com/in/jane-doe?utm_source=share', 'linkedin:jane-doe'],
    ['https://ua.linkedin.com/in/%D0%BE%D0%BB%D0%B5%D0%BD%D0%B0', 'linkedin:олена'],
  ])('recognises LinkedIn %s', (input, key) => {
    expect(parseContact(input)).toEqual({ type: 'LINKEDIN', key });
  });

  it.each([
    ['@Jane_Doe', 'telegram:jane_doe'],
    ['https://t.me/jane_doe', 'telegram:jane_doe'],
    ['t.me/JaneDoe ', 'telegram:janedoe'],
  ])('recognises Telegram %s', (input, key) => {
    expect(parseContact(input)).toEqual({ type: 'TELEGRAM', key });
  });

  it.each([
    '',
    'jane doe',
    'https://linkedin.com/company/acme',
    '@abc',
    'https://example.com/in/x',
  ])('rejects %s', (input) => {
    expect(parseContact(input)).toBeNull();
  });
});
