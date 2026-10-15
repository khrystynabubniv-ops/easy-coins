import { env } from '@/lib/env';
import { questionMessage } from '@/lib/messages';
import { getQuestionForWeek } from '@/lib/questions';
import { isBroadcastDue, weekKey } from '@/lib/schedule';
import { prisma } from '@/lib/prisma';
import { openDm, postMessage, SlackApiError } from '@/server/slack-api';

export async function ensureCurrentRound(now = new Date()) {
  const key = weekKey(now);
  return prisma.round.upsert({
    where: { weekKey: key },
    update: {},
    create: { weekKey: key, questionText: getQuestionForWeek() },
  });
}

export interface BroadcastResult {
  weekKey: string;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Sends the current week's question to everyone in ALLOWED_SLACK_IDS.
 * `scheduled` skips people who already got this week's question; `manual` always re-sends
 * (used for testing), replacing the stored message reference.
 */
export async function broadcastQuestion(mode: 'scheduled' | 'manual'): Promise<BroadcastResult> {
  const round = await ensureCurrentRound();
  const result: BroadcastResult = { weekKey: round.weekKey, sent: 0, skipped: 0, failed: 0 };

  for (const slackUserId of env.ALLOWED_SLACK_IDS) {
    if (mode === 'scheduled') {
      const existing = await prisma.delivery.findUnique({
        where: { roundId_slackUserId: { roundId: round.id, slackUserId } },
      });
      if (existing) {
        result.skipped++;
        continue;
      }
    }
    try {
      const channelId = await openDm(slackUserId);
      const messageTs = await postMessage(
        channelId,
        questionMessage(round.questionText, round.id, env.COINS_BASE),
      );
      await prisma.delivery.upsert({
        where: { roundId_slackUserId: { roundId: round.id, slackUserId } },
        update: { channelId, messageTs, status: 'SENT' },
        create: { roundId: round.id, slackUserId, channelId, messageTs },
      });
      result.sent++;
    } catch (e) {
      result.failed++;
      console.error(
        JSON.stringify({
          msg: 'broadcast_send_failed',
          error: e instanceof SlackApiError ? e.code : 'unexpected',
        }),
      );
    }
  }

  console.info(JSON.stringify({ msg: 'broadcast_done', mode, ...result }));
  return result;
}

/** Runs the Tuesday broadcast at most once per round, even across restarts or replicas. */
export async function runScheduledBroadcastIfDue(now = new Date()) {
  if (!isBroadcastDue(now)) return;
  const round = await ensureCurrentRound(now);
  if (round.scheduledSentAt) return;
  const claim = await prisma.round.updateMany({
    where: { id: round.id, scheduledSentAt: null },
    data: { scheduledSentAt: now },
  });
  if (claim.count !== 1) return;
  await broadcastQuestion('scheduled');
}
