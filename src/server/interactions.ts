import { env } from '@/lib/env';
import {
  ACTION_ID,
  LIMIT_TEXT,
  MODAL_CALLBACK_ID,
  SKIP_TEXT,
  duplicateMessage,
  recommendationModal,
  thanksMessage,
  type ModalMetadata,
} from '@/lib/messages';
import { prisma } from '@/lib/prisma';
import {
  MAX_RECOMMENDATIONS_PER_ROUND,
  parseRecommendationForm,
  type SlackViewState,
} from '@/lib/recommendation-form';
import { postMessage, slackApi } from '@/server/slack-api';

interface BlockActionsPayload {
  type: 'block_actions';
  user: { id: string };
  trigger_id: string;
  channel?: { id: string };
  container?: { channel_id?: string };
  message?: { ts: string; thread_ts?: string };
  actions?: { action_id: string; value?: string }[];
}

interface ViewSubmissionPayload {
  type: 'view_submission';
  user: { id: string };
  view: { callback_id: string; private_metadata: string; state: { values: SlackViewState } };
}

export type InteractionPayload = BlockActionsPayload | ViewSubmissionPayload | { type: string };

export interface InteractionOutcome {
  /** JSON body for the HTTP ack (e.g. modal validation errors); empty ack when undefined. */
  body?: unknown;
  /** Work that may run after Slack has been acknowledged. */
  after?: () => Promise<void>;
}

function countByAuthor(roundId: string, authorSlackId: string) {
  return prisma.recommendation.count({ where: { roundId, authorSlackId } });
}

async function handleBlockAction(p: BlockActionsPayload): Promise<InteractionOutcome> {
  const action = p.actions?.[0];
  const roundId = action?.value;
  const channelId = p.container?.channel_id ?? p.channel?.id;
  const threadTs = p.message?.thread_ts ?? p.message?.ts;
  if (!action || !roundId || !channelId || !threadTs) return {};

  if (action.action_id === ACTION_ID.skip) {
    await prisma.delivery.updateMany({
      where: { roundId, slackUserId: p.user.id },
      data: { status: 'SKIPPED' },
    });
    return {
      after: () => postMessage(channelId, { text: SKIP_TEXT }, threadTs).then(() => undefined),
    };
  }

  if (action.action_id !== ACTION_ID.open && action.action_id !== ACTION_ID.more) return {};

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) return {};

  if ((await countByAuthor(roundId, p.user.id)) >= MAX_RECOMMENDATIONS_PER_ROUND) {
    return {
      after: () => postMessage(channelId, { text: LIMIT_TEXT }, threadTs).then(() => undefined),
    };
  }

  // trigger_id expires after 3 seconds, so the modal is opened before the ack.
  const metadata: ModalMetadata = { roundId, channelId, threadTs };
  await slackApi('views.open', {
    trigger_id: p.trigger_id,
    view: recommendationModal(round.questionText, metadata),
  });
  return {};
}

async function handleViewSubmission(p: ViewSubmissionPayload): Promise<InteractionOutcome> {
  if (p.view.callback_id !== MODAL_CALLBACK_ID) return {};

  const form = parseRecommendationForm(p.view.state.values);
  if (!form.ok) return { body: { response_action: 'errors', errors: form.errors } };

  const meta = JSON.parse(p.view.private_metadata) as ModalMetadata;
  const authorSlackId = p.user.id;

  if ((await countByAuthor(meta.roundId, authorSlackId)) >= MAX_RECOMMENDATIONS_PER_ROUND) {
    return {
      after: () =>
        postMessage(meta.channelId, { text: LIMIT_TEXT }, meta.threadTs).then(() => undefined),
    };
  }

  const previous = await prisma.recommendation.findFirst({
    where: { contactKey: form.data.contactKey },
    select: { id: true },
  });
  const isDuplicate = previous !== null;

  await prisma.recommendation.create({
    data: {
      ...form.data,
      roundId: meta.roundId,
      authorSlackId,
      isDuplicate,
      coinsAmount: isDuplicate ? 0 : env.COINS_BASE,
      coinsStatus: isDuplicate ? 'NOT_ELIGIBLE' : 'PENDING',
      channelId: meta.channelId,
      threadTs: meta.threadTs,
    },
  });
  console.info(JSON.stringify({ msg: 'recommendation_saved', duplicate: isDuplicate }));

  const reply = isDuplicate
    ? duplicateMessage(meta.roundId)
    : thanksMessage(form.data.candidateName, meta.roundId, env.COINS_BASE, env.COINS_BONUS);
  return { after: () => postMessage(meta.channelId, reply, meta.threadTs).then(() => undefined) };
}

export async function handleInteraction(payload: InteractionPayload): Promise<InteractionOutcome> {
  if (payload.type === 'block_actions') return handleBlockAction(payload as BlockActionsPayload);
  if (payload.type === 'view_submission')
    return handleViewSubmission(payload as ViewSubmissionPayload);
  return {};
}
