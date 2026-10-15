# Easy Coins

Slack bot for the Universe Network «Easy Coins» programme. Once a week it asks people about
strong professionals in their circle; answers arrive through a Slack modal, are stored in Notion,
and the author receives coins through the Coin Awards API (shop.uni.tech).

**Current state:** skeleton only. The service verifies Slack requests and acknowledges them.
Business logic (weekly broadcast, modal, Notion, coins) comes in the next steps.

## Endpoints

| Method | Path                      | Purpose                                                               |
| ------ | ------------------------- | --------------------------------------------------------------------- |
| POST   | `/api/slack/events`       | Slack Events API. Answers `url_verification`, logs other event types. |
| POST   | `/api/slack/interactions` | Slack interactivity (`payload` form field). Acks immediately.         |
| GET    | `/api/health`             | Railway healthcheck: `{ "ok": true, ... }`, 503 if the DB is down.    |

Both Slack endpoints verify `X-Slack-Signature` / `X-Slack-Request-Timestamp` against
`SLACK_SIGNING_SECRET` over the raw body (HMAC-SHA256, timing-safe compare, 5-minute window)
and return `401` otherwise. The logic lives in `src/lib/slack-signature.ts` and is unit-tested.

## Local setup

Requirements: Node 24 (`.nvmrc`), Docker Desktop.

```bash
npm install
docker compose up -d
cp .env.example .env.local   # fill in values; never commit them
npm run dev
```

Checks to run before every push (`git push` to `main` deploys to Railway):

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Environment variables

See `.env.example`. `DATABASE_URL`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` are validated at
boot in `src/lib/env.ts`. In production they are set in Railway → service → Variables.
