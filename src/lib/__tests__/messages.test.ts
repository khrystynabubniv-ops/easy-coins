import { describe, expect, it } from 'vitest';
import { questionMessage, thanksMessage } from '@/lib/messages';

describe('messages', () => {
  it('puts the coin amount into the weekly question', () => {
    const m = questionMessage('Питання?', 'r1', 5);
    expect(JSON.stringify(m.blocks)).toContain('За кожну рекомендацію +5 коїнів.');
  });

  it('escapes the candidate name in the thanks message', () => {
    const m = thanksMessage('<@U1> & Co', 'r1', 5, 15);
    expect(m.text).toContain('Дякуємо за &lt;@U1&gt; &amp; Co!');
    expect(m.text).toContain('+5 коїнів');
    expect(m.text).toContain('ще +15.');
  });
});
