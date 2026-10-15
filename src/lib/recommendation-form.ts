import { parseContact, type ContactType } from '@/lib/contact';

export const MIN_REASON_LENGTH = 50;
export const MAX_RECOMMENDATIONS_PER_ROUND = 3;

export const BLOCK = {
  name: 'name',
  contact: 'contact',
  reason: 'reason',
  companyRole: 'company_role',
  relation: 'relation',
  closeness: 'closeness',
  consent: 'consent',
} as const;
export const ACTION = 'value';

export const RELATION_OPTIONS = [
  { value: 'COLLEAGUE', label: 'Колега' },
  { value: 'MANAGER', label: 'Керівник' },
  { value: 'REPORT', label: 'Підлеглий' },
  { value: 'FRIEND', label: 'Друг' },
  { value: 'OTHER', label: 'Інше' },
] as const;

export const CLOSENESS_OPTIONS = [
  { value: 'VERY_WELL', label: 'Дуже добре' },
  { value: 'WELL', label: 'Добре' },
  { value: 'SUPERFICIAL', label: 'Поверхово' },
] as const;

export type Relation = (typeof RELATION_OPTIONS)[number]['value'];
export type Closeness = (typeof CLOSENESS_OPTIONS)[number]['value'];

export const ERROR_TEXT = {
  contact:
    'Додай, будь ласка, посилання на профіль людини (LinkedIn, Instagram тощо) або @username у Telegram — так ми точно знайдемо людину',
  reason:
    'Розкажи трохи більше: що саме ця людина зробила чи чим сильна? Це допоможе рекрутеру зрозуміти, куди її кликати',
  name: "Вкажи, будь ласка, ім'я та прізвище",
} as const;

/** Subset of Slack's `view.state.values` that we read. */
interface SlackStateValue {
  value?: string | null;
  selected_option?: { value: string } | null;
  selected_options?: { value: string }[];
}
export type SlackViewState = Record<
  string,
  Record<string, SlackStateValue | undefined> | undefined
>;

export interface RecommendationInput {
  candidateName: string;
  contactRaw: string;
  contactType: ContactType;
  contactKey: string;
  reason: string;
  companyRole: string | null;
  relation: Relation | null;
  closeness: Closeness | null;
  mayMentionAuthor: boolean;
}

export type ParseResult =
  { ok: true; data: RecommendationInput } | { ok: false; errors: Partial<Record<string, string>> };

function field(state: SlackViewState, block: string): SlackStateValue | undefined {
  return state[block]?.[ACTION];
}

function text(state: SlackViewState, block: string): string {
  return (field(state, block)?.value ?? '').trim();
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly { value: T }[]) {
  return allowed.find((o) => o.value === value)?.value ?? null;
}

export function parseRecommendationForm(state: SlackViewState): ParseResult {
  const candidateName = text(state, BLOCK.name);
  const contactRaw = text(state, BLOCK.contact);
  const reason = text(state, BLOCK.reason);
  const errors: Partial<Record<string, string>> = {};

  if (!candidateName) errors[BLOCK.name] = ERROR_TEXT.name;
  const contact = parseContact(contactRaw);
  if (!contact) errors[BLOCK.contact] = ERROR_TEXT.contact;
  if (reason.length < MIN_REASON_LENGTH) errors[BLOCK.reason] = ERROR_TEXT.reason;

  if (!contact || Object.keys(errors).length > 0) return { ok: false, errors };

  const companyRole = text(state, BLOCK.companyRole);
  return {
    ok: true,
    data: {
      candidateName,
      contactRaw,
      contactType: contact.type,
      contactKey: contact.key,
      reason,
      companyRole: companyRole || null,
      relation: oneOf(field(state, BLOCK.relation)?.selected_option?.value, RELATION_OPTIONS),
      closeness: oneOf(field(state, BLOCK.closeness)?.selected_option?.value, CLOSENESS_OPTIONS),
      mayMentionAuthor: (field(state, BLOCK.consent)?.selected_options ?? []).length > 0,
    },
  };
}
