import { ACTION, BLOCK, CLOSENESS_OPTIONS, RELATION_OPTIONS } from '@/lib/recommendation-form';

export const ACTION_ID = {
  open: 'recommend_open',
  skip: 'recommend_skip',
  more: 'recommend_more',
} as const;
export const MODAL_CALLBACK_ID = 'recommend_submit';

/** Escapes user-provided text for Slack mrkdwn. */
export function escapeMrkdwn(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const plain = (t: string) => ({ type: 'plain_text' as const, text: t, emoji: true });
const mrkdwn = (t: string) => ({ type: 'mrkdwn' as const, text: t });

/** `allowSkip: false` is used once the person has recommended someone this week. */
export function questionMessage(
  question: string,
  roundId: string,
  coinsBase: number,
  { allowSkip = true }: { allowSkip?: boolean } = {},
) {
  const body = `🧠 *Питання тижня*\n${escapeMrkdwn(question)}\nЯкщо когось згадав — поділись, це хвилина. За кожну рекомендацію +${String(coinsBase)} коїнів.`;
  const buttons: Record<string, unknown>[] = [
    {
      type: 'button',
      style: 'primary',
      action_id: ACTION_ID.open,
      value: roundId,
      text: plain('Згадати людину'),
    },
  ];
  if (allowSkip) {
    buttons.push({
      type: 'button',
      action_id: ACTION_ID.skip,
      value: roundId,
      text: plain('Пропустити цей тиждень'),
    });
  }
  return {
    text: `Питання тижня: ${question}`,
    blocks: [
      { type: 'section', text: mrkdwn(body) },
      { type: 'actions', elements: buttons },
    ],
  };
}

export const SKIP_TEXT =
  'Ок, до наступного тижня 🙌 Якщо хтось згадається пізніше — кнопка «Згадати людину» тут залишається.';

export const LIMIT_TEXT =
  'Дякуємо, це вже 3 рекомендації на це питання 🧡 Бережемо простір для наступного тижня — там буде нове питання.';

export const DUPLICATE_TEXT =
  'Цю людину вже хтось згадував — значить, вона справді сильна 🙂 Твій відгук ми додали до її картки, це допоможе рекрутеру. Коїни за повторні рекомендації не нараховуються.';

export function thanksMessage(
  candidateName: string,
  roundId: string,
  coinsBase: number,
  coinsBonus: number,
) {
  const body = `Дякуємо за ${escapeMrkdwn(candidateName)}! 🧡 +${String(coinsBase)} коїнів уже на твоєму балансі. Рекрутер подивиться рекомендацію протягом кількох днів. Якщо візьме її в роботу — отримаєш ще +${String(coinsBonus)}. Усі новини — в цьому треді.`;
  return {
    text: body,
    blocks: [{ type: 'section', text: mrkdwn(body) }, moreButton(roundId)],
  };
}

export function duplicateMessage(roundId: string) {
  return {
    text: DUPLICATE_TEXT,
    blocks: [{ type: 'section', text: mrkdwn(DUPLICATE_TEXT) }, moreButton(roundId)],
  };
}

function moreButton(roundId: string) {
  return {
    type: 'actions',
    elements: [
      {
        type: 'button',
        action_id: ACTION_ID.more,
        value: roundId,
        text: plain('Згадати ще одну людину'),
      },
    ],
  };
}

export interface ModalMetadata {
  roundId: string;
  channelId: string;
  threadTs: string;
}

const option = (o: { value: string; label: string }) => ({ value: o.value, text: plain(o.label) });

export function recommendationModal(question: string, metadata: ModalMetadata) {
  return {
    type: 'modal',
    callback_id: MODAL_CALLBACK_ID,
    private_metadata: JSON.stringify(metadata),
    title: plain('Згадати людину'),
    submit: plain('Надіслати'),
    close: plain('Скасувати'),
    blocks: [
      { type: 'context', elements: [mrkdwn(escapeMrkdwn(question))] },
      {
        type: 'input',
        block_id: BLOCK.name,
        label: plain("Ім'я та прізвище"),
        element: { type: 'plain_text_input', action_id: ACTION, max_length: 150 },
      },
      {
        type: 'input',
        block_id: BLOCK.contact,
        label: plain('Посилання на профіль або Telegram'),
        hint: plain('LinkedIn, Instagram чи будь-яке інше посилання, або @username у Telegram'),
        element: { type: 'plain_text_input', action_id: ACTION, max_length: 300 },
      },
      {
        type: 'input',
        block_id: BLOCK.reason,
        label: plain('Чому ця людина сильна'),
        hint: plain('1–2 речення: що вона зробила або чим тебе вразила'),
        element: {
          type: 'plain_text_input',
          action_id: ACTION,
          multiline: true,
          max_length: 2000,
        },
      },
      {
        type: 'input',
        block_id: BLOCK.companyRole,
        optional: true,
        label: plain('Компанія та роль'),
        element: { type: 'plain_text_input', action_id: ACTION, max_length: 200 },
      },
      {
        type: 'input',
        block_id: BLOCK.relation,
        optional: true,
        label: plain('Звідки знаєш'),
        element: {
          type: 'static_select',
          action_id: ACTION,
          placeholder: plain('Обери варіант'),
          options: RELATION_OPTIONS.map(option),
        },
      },
      {
        type: 'input',
        block_id: BLOCK.closeness,
        optional: true,
        label: plain('Наскільки добре знаєш'),
        element: {
          type: 'static_select',
          action_id: ACTION,
          placeholder: plain('Обери варіант'),
          options: CLOSENESS_OPTIONS.map(option),
        },
      },
      {
        type: 'input',
        block_id: BLOCK.consent,
        optional: true,
        label: plain('Згода'),
        element: {
          type: 'checkboxes',
          action_id: ACTION,
          options: [{ value: 'yes', text: plain('Можна згадати мене, коли контактуватимете') }],
        },
      },
    ],
  };
}
