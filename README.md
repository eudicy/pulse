# Pulse

Auto-generate weekly team updates and stakeholder reports from your tasks — no manual writing required.

Pulse is a lightweight project management tool for small startups (2–20 people). It tracks tasks and projects, then every Monday automatically composes a polished status update — optionally refined by an LLM — that you can share with stakeholders via a one-click share link.

## Features

- **Projects & Tasks** — create projects, assign tasks to team members, track status (To Do / In Progress / Blocked / Done)
- **Weekly reports** — auto-generated every Monday from task activity; narrative optionally polished by Claude Haiku with a configurable monthly budget cap and graceful fallback
- **Stakeholder reports** — one-click generation with expiring share links (30 days); no login required to view
- **Export** — download any stakeholder report as Markdown or PDF
- **Multi-tenant** — each team's data is fully isolated; invite members via email
- **Rate limiting** — Upstash Redis-backed limiters on auth and invite endpoints

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL 16 via Prisma v5 |
| Auth | NextAuth v5 (JWT sessions) |
| Email | Mailpit (dev) / Resend (prod) |
| Rate limiting | Upstash Redis |
| LLM | Anthropic claude-haiku-4-5 |
| PDF export | @react-pdf/renderer |
| Error tracking | Sentry |
| Cron | Vercel Cron (Monday 09:00 UTC) |

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker + Docker Compose

## Local setup

### 1. Clone and install

```bash
git clone <repo-url>
cd pulse
pnpm install
```

### 2. Start backing services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 16 on `localhost:5432`
- Mailpit SMTP on `localhost:1025` (web UI at http://localhost:8025)
- Redis on `localhost:6379`

### 3. Configure environment

```bash
cp .env.example .env
```

Minimum required changes:

```env
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
CRON_SECRET="your-cron-secret-here"
```

Optional but recommended:

```env
# Enables LLM narrative polish on weekly reports
ANTHROPIC_API_KEY="sk-ant-..."
LLM_MONTHLY_BUDGET_CENTS="500"   # $5.00/month cap per team
```

All other defaults work as-is for local development. Mailpit handles outbound email, and rate limiting is skipped gracefully when Upstash is not configured.

### 4. Set up the database

```bash
pnpm prisma migrate dev
```

### 5. Start the dev server

```bash
pnpm dev
```

Open http://localhost:3000, sign up, and create your first project.

## Running tests

```bash
pnpm test
```

Unit tests cover DST-safe period boundaries, report engine invariants, boundary-inclusive task classification, and cross-tenant write rejection.

## Triggering a weekly report manually

The cron endpoint is authenticated via `CRON_SECRET`:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-updates
```

Returns `{ "total": N, "failed": 0 }`.

## Deployment

### Vercel (recommended)

1. Push to GitHub and import the repo in Vercel
2. Set all environment variables from `.env.example`
3. Set `DATABASE_URL` to a Neon or Supabase connection string
4. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for rate limiting
5. Set `RESEND_API_KEY` and `EMAIL_FROM` for transactional email
6. The cron job in `vercel.json` fires automatically every Monday at 09:00 UTC

### Database migrations in production

```bash
pnpm prisma migrate deploy
```

## Environment variable reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Public base URL (e.g. `https://yourapp.com`) |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing |
| `CRON_SECRET` | Yes | Bearer token for the cron endpoint |
| `EMAIL_FROM` | Yes | Sender address for invite / magic-link emails |
| `RESEND_API_KEY` | Prod | Resend API key (omit to use raw SMTP) |
| `EMAIL_SERVER_HOST` | Dev | SMTP host (default: `localhost`) |
| `EMAIL_SERVER_PORT` | Dev | SMTP port (default: `1025`) |
| `ANTHROPIC_API_KEY` | No | Enables LLM narrative polish on weekly reports |
| `LLM_MONTHLY_BUDGET_CENTS` | No | Per-team monthly LLM cap in cents (default: `500`) |
| `UPSTASH_REDIS_REST_URL` | No | Enables rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash auth token |
| `SENTRY_DSN` | No | Sentry error tracking |
