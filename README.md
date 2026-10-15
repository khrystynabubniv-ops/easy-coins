# Easy Coins

**Production:** https://easy-coins-production.up.railway.app

**Railway:** https://railway.com/project/899c7022-ab45-4021-8514-9f01c776a8c4/service/c6826560-30ce-4135-9d0c-ca2e21e16d6a?environmentId=da610ff5-fdc9-4637-bfe0-cf64773f5bab

**Railway workspace:** khrystynabubniv-ops's Projects (personal; to be moved to Universe Unicore)

**Slack manifest URLs:**

- `event_subscriptions.request_url`: https://easy-coins-production.up.railway.app/api/slack/events
- `interactivity.request_url`: https://easy-coins-production.up.railway.app/api/slack/interactions

Slack bot for the Universe Network «Easy Coins» programme. Once a week it asks people about
strong professionals in their circle; answers arrive through a Slack modal, are stored in Notion,
and the author receives coins through the Coin Awards API (shop.uni.tech).

**Current state:** weekly question in DM (Tue 11:00 Europe/Kyiv) to `ALLOWED_SLACK_IDS`,
recommendation modal with validation, duplicate detection (by LinkedIn/Telegram) and a limit of
3 recommendations per question. Recommendations are stored in Postgres with coins `PENDING`.
Not yet: Notion «Банк питань» / participants / recommendations, Coin Awards API.

## Endpoints

| Method | Path                      | Purpose                                                                          |
| ------ | ------------------------- | -------------------------------------------------------------------------------- |
| POST   | `/api/slack/events`       | Slack Events API. Answers `url_verification`, logs other event types.            |
| POST   | `/api/slack/interactions` | Slack interactivity (`payload` form field). Acks immediately.                    |
| POST   | `/api/admin/broadcast`    | Manual send of this week's question (`Authorization: Bearer $ADMIN_API_SECRET`). |
| GET    | `/api/health`             | Railway healthcheck: `{ "ok": true, ... }`, 503 if the DB is down.               |

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

See `.env.example`. All variables are validated at boot in `src/lib/env.ts`. In production they are set in Railway → service → Variables.

## Weekly schedule

`src/instrumentation.ts` starts a one-minute ticker in the production server. On Tuesday from
11:00 Kyiv time it creates the week's `Round` (ISO week, `2026-W42`) and sends the question once;
the claim on `Round.scheduledSentAt` keeps it to one run across restarts. Slack bot scopes needed:
`chat:write`, `im:write`.
