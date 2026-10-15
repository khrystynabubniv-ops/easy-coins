import { z } from 'zod';

const slackIdList = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  );

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  SLACK_BOT_TOKEN: z.string().startsWith('xoxb-'),
  SLACK_SIGNING_SECRET: z.string().min(1),
  /** Bearer token for the manual broadcast endpoint. */
  ADMIN_API_SECRET: z.string().min(32),
  /** Comma-separated Slack user IDs who receive the weekly question. */
  ALLOWED_SLACK_IDS: slackIdList,
  COINS_BASE: z.coerce.number().int().min(0),
  COINS_BONUS: z.coerce.number().int().min(0),
});

export const env = schema.parse(process.env);
