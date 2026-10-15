import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  SLACK_BOT_TOKEN: z.string().startsWith('xoxb-'),
  SLACK_SIGNING_SECRET: z.string().min(1),
});

export const env = schema.parse(process.env);
