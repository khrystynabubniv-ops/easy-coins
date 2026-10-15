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
    ['https://www.instagram.com/Jane.Doe/?igsh=abc', 'url:instagram.com/jane.doe'],
    ['instagram.com/jane.doe', 'url:instagram.com/jane.doe'],
    ['https://github.com/janedoe', 'url:github.com/janedoe'],
    ['https://www.linkedin.com/feed/', 'url:linkedin.com/feed'],
  ])('accepts any other link %s', (input, key) => {
    expect(parseContact(input)).toEqual({ type: 'OTHER', key });
  });

  it.each(['', 'олена', 'jane doe', '@abc', 'https://localhost/x', 'just text.'])(
    'rejects %s',
    (input) => {
      expect(parseContact(input)).toBeNull();
    },
  );
});
