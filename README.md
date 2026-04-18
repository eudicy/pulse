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

## Getting started

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup instructions (Docker or Podman), running tests, triggering the cron manually, deployment, and the full environment variable reference.
