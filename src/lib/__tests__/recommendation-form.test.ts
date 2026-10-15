import { describe, expect, it } from 'vitest';
import {
  BLOCK,
  ERROR_TEXT,
  parseRecommendationForm,
  type SlackViewState,
} from '@/lib/recommendation-form';

const reason =
  'Запустила платіжний сервіс з нуля за три місяці й вивела команду на релізи щотижня.';

function state(overrides: Partial<Record<string, object>> = {}): SlackViewState {
  const base: Record<string, object> = {
    [BLOCK.name]: { value: { value: 'Олена Коваль' } },
    [BLOCK.contact]: { value: { value: '@olena_k' } },
    [BLOCK.reason]: { value: { value: reason } },
    [BLOCK.companyRole]: { value: { value: null } },
    [BLOCK.relation]: { value: { selected_option: null } },
    [BLOCK.closeness]: { value: { selected_option: null } },
    [BLOCK.consent]: { value: { selected_options: [] } },
  };
  return { ...base, ...overrides } as SlackViewState;
}

describe('parseRecommendationForm', () => {
  it('accepts required fields only', () => {
    const r = parseRecommendationForm(state());
    expect(r).toEqual({
      ok: true,
      data: {
        candidateName: 'Олена Коваль',
        contactRaw: '@olena_k',
        contactType: 'TELEGRAM',
        contactKey: 'telegram:olena_k',
        reason,
        companyRole: null,
        relation: null,
        closeness: null,
        mayMentionAuthor: false,
      },
    });
  });

  it('reads optional fields', () => {
    const r = parseRecommendationForm(
      state({
        [BLOCK.companyRole]: { value: { value: ' Acme, CTO ' } },
        [BLOCK.relation]: { value: { selected_option: { value: 'MANAGER' } } },
        [BLOCK.closeness]: { value: { selected_option: { value: 'WELL' } } },
        [BLOCK.consent]: { value: { selected_options: [{ value: 'yes' }] } },
      }),
    );
    expect(r.ok && r.data).toMatchObject({
      companyRole: 'Acme, CTO',
      relation: 'MANAGER',
      closeness: 'WELL',
      mayMentionAuthor: true,
    });
  });

  it('returns the agreed error texts', () => {
    const r = parseRecommendationForm(
      state({
        [BLOCK.contact]: { value: { value: 'olena' } },
        [BLOCK.reason]: { value: { value: 'Класна' } },
      }),
    );
    expect(r).toEqual({
      ok: false,
      errors: { [BLOCK.contact]: ERROR_TEXT.contact, [BLOCK.reason]: ERROR_TEXT.reason },
    });
  });

  it('counts the 50-character minimum after trimming', () => {
    const r = parseRecommendationForm(
      state({ [BLOCK.reason]: { value: { value: `  ${'а'.repeat(49)}  ` } } }),
    );
    expect(r.ok).toBe(false);
  });
});
