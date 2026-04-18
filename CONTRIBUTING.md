# Contributing to Pulse

Thank you for your interest in contributing. This guide covers everything you need to get a local development environment running and submit changes.

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker **or** Podman (with Compose support)
  - Docker: [docs.docker.com/get-docker](https://docs.docker.com/get-docker/)
  - Podman: [podman.io/get-started](https://podman.io/get-started/) — includes `podman compose` via the built-in compose provider, or install `podman-compose` separately

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/eudicy/pulse.git
cd pulse
pnpm install
```

### 2. Start backing services

**Docker:**
```bash
docker compose up -d
```

**Podman:**
```bash
podman compose up -d
```

Both start the same three services:
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

## Stopping services

**Docker:**
```bash
docker compose down
```

**Podman:**
```bash
podman compose down
```

To also remove the database volume (full reset):

**Docker:**
```bash
docker compose down -v
```

**Podman:**
```bash
podman compose down -v
```

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

## Submitting changes

1. Create a branch from `main`
2. Make your changes and add tests where appropriate
3. Ensure `pnpm test` and `pnpm build` both pass
4. Open a pull request with a clear description of what changed and why
