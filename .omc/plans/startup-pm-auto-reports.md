# Work Plan: Startup PM Tool with Auto-Generated Reports

- **Plan ID:** startup-pm-auto-reports
- **Source Spec:** `.omc/specs/deep-interview-startup-pm-auto-reports.md`
- **Mode:** ralplan consensus (SHORT, not `--deliberate`)
- **Status:** APPROVED — Architect + Critic consensus reached (iteration 2)

---

## 1. RALPLAN-DR Summary

### Principles (guiding decisions)
1. **Report engine is the product.** Every schema field, UI flow, and API endpoint must exist to enable high-quality auto-generated reports. If a feature does not feed the report, defer it.
2. **Boring, batteries-included stack.** Favor a single full-stack framework with first-party auth, DB, and deployment story — we are a 4-week MVP, not a distributed system. Monolith + SSR beats microservices + SPA.
3. **Multi-tenant from row one.** Every table that holds domain data carries `teamId`. Row-level scoping is enforced in the data access layer (Prisma `$extends`) and at the DB (CHECK constraint / trigger), not bolted on later.
4. **Deterministic facts + LLM narrative polish.** Structured sections (completed[], blocked[], etc.) are produced by pure functions over task data. The `narrative` field is rewritten by an LLM for stakeholder quality, with deterministic fallback on error or budget exhaust.
5. **Non-technical usability is a first-class acceptance test.** No jargon, no modal-within-modal, no hidden shortcuts. If a flow needs docs, it fails.

### Decision Drivers (top 3)
1. **Time to MVP (4-week ship target)** — eliminates stacks requiring heavy bespoke infra.
2. **Report generation quality with zero manual input** — drives schema richness (status transitions, `completedAt`, `dueDate` slippage, `blockedReason`, `timezone`) and motivates LLM narrative polish.
3. **Non-technical usability** — forces a single, linear flow (Team -> Project -> Task -> Report).

### Viable Options (tech stack)

| Option | Stack | Pros | Cons |
|---|---|---|---|
| **A: Next.js + Postgres + Prisma + NextAuth (recommended)** | Next.js 15 App Router, TypeScript, Prisma 5, PostgreSQL 16, NextAuth v5 pinned, Tailwind + shadcn/ui, Vercel + Neon | Single codebase, mature auth/ORM, Vercel cron + one-command deploy, shadcn solves usability bar cheaply | Vercel fn limits on long PDF (mitigable); NextAuth v5 still beta (mitigation: version pin + JWT sessions) |
| **B: Rails 8 monolith + Postgres + Hotwire** | Rails 8, Devise, Turbo/Stimulus, Sidekiq, Postgres, Kamal + VPS | Fastest CRUD velocity, native background jobs, Action Mailer | Smaller TS-native hiring pool; Kamal + VPS = more ops; weaker PDF libs |
| **C: SvelteKit + Drizzle + Lucia** | SvelteKit, Drizzle, Lucia, Tailwind, Fly.io | Small bundle, fast DX, type-safe | Lucia instability; smaller UI-kit ecosystem; less PDF/email tooling |

### Recommendation: **Option A (Next.js + Postgres + Prisma + NextAuth)**
Rationale: best balance of speed-to-MVP, ecosystem maturity (shadcn/ui delivers the "non-technical usability" bar cheaply), Prisma schema-first modeling matches our ontology-driven planning, and Vercel + managed Postgres collapses the ops surface to near-zero for a 2-person team.

**Alternatives invalidated rationale:** B and C remain *technically* viable; Option A wins on driver-weighted scoring (time-to-MVP + ecosystem + hiring). B is the strong runner-up if the team has Rails muscle memory; C is deprioritized because of Lucia's instability and weaker PDF/email coverage.

---

## 2. Context

Greenfield project in `/home/galadriel/Documents/Cline/insane-idea`. No existing code. Spec passed deep-interview at 14.3% ambiguity. Six acceptance criteria, six entities, four-week implicit budget.

## 3. Work Objectives

- Ship a web app where a 2–20 person startup can: sign up, create a team, invite members, create projects, manage tasks, and receive auto-generated weekly status updates + one-click stakeholder reports — all without reading docs.
- All acceptance criteria (AC1–AC6) satisfied and covered by tests.
- Multi-tenant isolation provably enforced on reads **and writes** via Prisma `$extends` + Postgres constraints.
- Report narrative is LLM-polished with deterministic fallback; structured sections remain deterministic.

## 4. Guardrails

### Must Have
- `teamId` on every domain table; all reads and writes scoped by session team through Prisma `$extends`.
- Postgres CHECK constraint or trigger enforcing `Task.teamId === Project.teamId`.
- `TaskStatusEvent` emitted **automatically at the data layer** whenever `Task.status` changes (no convention, no "remember to write the event").
- JWT session strategy with `teamId` and `role` embedded in token claims.
- Invite-by-email flow with expiring signed token.
- Team `timezone` field drives all period-boundary math in report generation.
- Rate limiting on all auth + invite + share routes.
- Sentry captures at least one intentional test error before deploy.
- `contentVersion` on both report models for forward-compatible JSON evolution.

### Must NOT Have
- **Multi-team membership per user.** MVP is single-team-per-user (see Section 9 decision: Option B). Users wanting access to two teams use two email addresses. `TeamSwitcher` component is NOT built.
- GitHub / Slack / Linear sync.
- Payment / billing code paths.
- Time tracking fields on Task.
- Real-time collaboration (WebSocket, Yjs, Liveblocks).
- Mobile native wrappers.
- Role hierarchies beyond `ADMIN` / `MEMBER`.

## 5. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict | Full-stack, SSR, Route Handlers for API |
| DB | PostgreSQL 16 (Neon prod, Docker local) | Multi-tenant SQL, JSONB for report content |
| ORM | Prisma 5 (latest stable at plan time) | Schema-first, `$extends` for scoping + invariants |
| Auth | `next-auth@5.0.0-beta.25` (EXACT pin, no caret) + `@auth/prisma-adapter` | Magic-link primary + Credentials fallback, JWT sessions |
| UI | Tailwind CSS + shadcn/ui + lucide-react | Accessible primitives, usability default |
| Forms | react-hook-form + zod | Type-safe validation shared client/server |
| Email | Resend (prod), nodemailer + Mailpit (dev) | Invite + magic-link delivery |
| PDF (Phase 4) | `@react-pdf/renderer` | React -> PDF, no headless Chrome |
| Date/Timezone | `luxon` | DST-safe period-boundary math per team timezone |
| Rate limiting | `@upstash/ratelimit` + Upstash Redis (or `@vercel/edge-rate-limit`) | Edge-runtime IP rate limiting on auth/share |
| Observability | `@sentry/nextjs` | Error tracking; Phase 4 integration |
| LLM (narrative polish) | `@anthropic-ai/sdk` (claude-haiku-4-5) OR `openai` (gpt-4o-mini) | Per-team monthly budget; graceful fallback |
| Testing | Vitest (unit), Playwright (e2e), Prisma test DB | Covers logic + acceptance flows |
| Hosting | Vercel + Neon Postgres + Upstash Redis | One-click deploy, managed DB, managed rate-limit store |
| Lint/Format | ESLint + Prettier + TypeScript strict | Consistency |

## 6. Project Structure

```
/home/galadriel/Documents/Cline/insane-idea/
  app/
    (marketing)/
      page.tsx
      login/page.tsx
      signup/page.tsx
    (app)/
      layout.tsx                          # Auth-gated shell (NO TeamSwitcher — single-team MVP)
      dashboard/page.tsx
      projects/
        page.tsx
        new/page.tsx
        [projectId]/
          page.tsx
          tasks/new/page.tsx
          tasks/[taskId]/edit/page.tsx
      reports/
        weekly/page.tsx
        weekly/[updateId]/page.tsx
        stakeholder/page.tsx
        stakeholder/[reportId]/page.tsx   # Owner preview (authed)
      settings/
        team/page.tsx                     # Team name, timezone, invites, members
        account/page.tsx
    share/
      [token]/page.tsx                    # PUBLIC share route — token only, no reportId in URL
    api/
      auth/[...nextauth]/route.ts
      invites/accept/route.ts
      reports/weekly/generate/route.ts
      reports/stakeholder/generate/route.ts
      reports/stakeholder/[id]/export/route.ts
      reports/stakeholder/[id]/share/route.ts    # POST = create/rotate token, DELETE = revoke
      cron/weekly-updates/route.ts               # Vercel Cron trigger
  src/
    lib/
      db.ts                               # Prisma client with $extends (tenant scoping + status-event invariant)
      db-raw.ts                           # Un-extended client — ONLY for trusted admin paths (seed, migration scripts)
      auth.ts                             # NextAuth v5 config (JWT strategy)
      auth-session.ts                     # requireSession() helper
      email.ts
      rate-limit.ts                       # @upstash/ratelimit wrappers
      sentry.ts
      llm.ts                              # narrative-polish client + budget check
      time.ts                             # luxon-based period boundaries in team timezone
    server/
      teams/
        create-team.ts
        invite-member.ts
        accept-invite.ts
      projects/
        create-project.ts
        list-projects.ts
      tasks/
        create-task.ts
        update-task-status.ts
        list-tasks.ts
      reports/
        collect-task-facts.ts
        weekly-generator.ts
        stakeholder-generator.ts
        narrative-polish.ts               # LLM rewrite of narrative field only
        templates/
          weekly-template.ts
          stakeholder-template.ts
        share-tokens.ts
    components/
      ui/                                 # shadcn primitives
      tasks/TaskRow.tsx
      tasks/TaskStatusBadge.tsx
      projects/ProjectCard.tsx
      reports/WeeklyUpdateView.tsx
      reports/StakeholderReportView.tsx
      nav/Sidebar.tsx
      # NOTE: TeamSwitcher.tsx intentionally NOT included (single-team MVP)
    types/
      domain.ts
  prisma/
    schema.prisma
    migrations/
      .../migration.sql                   # includes CHECK / trigger SQL
    seed.ts                               # uses db-raw.ts + explicitly emits TaskStatusEvent rows
  tests/
    unit/
      reports/weekly-generator.test.ts
      reports/stakeholder-generator.test.ts
      reports/weekly-cron.test.ts         # cron partial-failure isolation
      reports/collect-task-facts.test.ts
      reports/narrative-polish.test.ts    # LLM fallback behavior
      tasks/status-event-invariant.test.ts
      tenant/scoping.test.ts              # read + write matrix
      time/period-boundaries.test.ts      # DST + timezone math
    integration/
      share-route.test.ts
      cron-route.test.ts
      concurrent-report-generation.test.ts
    e2e/
      signup-and-invite.spec.ts
      create-project-and-tasks.spec.ts
      generate-weekly-update.spec.ts
      export-stakeholder-report.spec.ts
      non-technical-usability.spec.ts
      share-link-expiry.spec.ts
  .env.example
  docker-compose.yml
  package.json
  sentry.client.config.ts
  sentry.server.config.ts
  vercel.json                              # cron entry + crons timezone
  README.md
```

## 7. Data Model (Prisma schema)

```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model Team {
  id         String   @id @default(cuid())
  name       String
  slug       String   @unique
  timezone   String   @default("UTC")          // IANA zone (e.g. "America/Los_Angeles")
  createdAt  DateTime @default(now())
  users      User[]
  projects   Project[]
  invites    Invite[]
  weeklyUpdates      WeeklyUpdate[]
  stakeholderReports StakeholderReport[]
}

enum Role { ADMIN MEMBER }

model User {
  id             String   @id @default(cuid())
  name           String?
  email          String   @unique
  emailVerified  DateTime?
  hashedPassword String?                    // optional; magic-link primary
  role           Role     @default(MEMBER)   // single-team MVP: role lives on User
  teamId         String                      // single-team MVP: direct FK (no TeamMembership)
  team           Team     @relation(fields: [teamId], references: [id])
  assignedTasks  Task[]   @relation("Assignee")
  generatedStakeholderReports StakeholderReport[] @relation("StakeholderReportGeneratedBy")
  accounts       Account[]
  verificationTokens VerificationToken[] @relation("UserVerificationTokens")
  createdAt      DateTime @default(now())
  @@index([teamId])
}

// NextAuth PrismaAdapter requires these for Account + VerificationToken (but NOT Session,
// since we use JWT strategy). Kept minimal.
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  userId     String?
  user       User?    @relation("UserVerificationTokens", fields: [userId], references: [id])
  @@unique([identifier, token])
}

model Invite {
  id         String   @id @default(cuid())
  teamId     String
  team       Team     @relation(fields: [teamId], references: [id])
  email      String
  token      String   @unique
  role       Role     @default(MEMBER)
  expiresAt  DateTime
  acceptedAt DateTime?
  createdAt  DateTime @default(now())
  @@index([teamId, email])
}

enum ProjectStatus { ACTIVE PAUSED COMPLETED ARCHIVED }

model Project {
  id          String   @id @default(cuid())
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id])
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  deadline    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tasks       Task[]
  stakeholderReports StakeholderReport[]
  @@index([teamId])
}

enum TaskStatus { TODO IN_PROGRESS BLOCKED DONE }

model Task {
  id            String   @id @default(cuid())
  teamId        String                              // denormalized for scoping; CHECK constraint enforces = Project.teamId
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id])
  title         String
  description   String?
  assigneeId    String?
  assignee      User?    @relation("Assignee", fields: [assigneeId], references: [id])
  dueDate       DateTime?
  status        TaskStatus @default(TODO)
  blockedReason String?                              // surfaces in Risks section when BLOCKED
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  statusEvents  TaskStatusEvent[]
  @@index([teamId, status])
  @@index([projectId])
  @@index([assigneeId])
}

model TaskStatusEvent {
  id         String      @id @default(cuid())
  taskId     String
  task       Task        @relation(fields: [taskId], references: [id])
  teamId     String
  fromStatus TaskStatus?
  toStatus   TaskStatus
  changedByUserId String?
  changedAt  DateTime    @default(now())
  @@index([teamId, changedAt])
  @@index([taskId, changedAt])
}

model WeeklyUpdate {
  id             String   @id @default(cuid())
  teamId         String
  team           Team     @relation(fields: [teamId], references: [id])
  periodStart    DateTime
  periodEnd      DateTime
  generatedAt    DateTime @default(now())
  contentVersion Int      @default(1)                // forward-compatible JSON schema
  content        Json                                 // { highlights[], completed[], inProgress[], blocked[], upcoming[], narrative }
  @@unique([teamId, periodStart])                    // idempotency key for cron upsert
}

enum ReportFormat { HTML MARKDOWN PDF }
enum ReportScope  { TEAM PROJECT }

model StakeholderReport {
  id                    String   @id @default(cuid())
  teamId                String
  team                  Team     @relation(fields: [teamId], references: [id])
  projectId             String?
  project               Project? @relation(fields: [projectId], references: [id])
  scope                 ReportScope
  periodStart           DateTime
  periodEnd             DateTime
  format                ReportFormat @default(HTML)
  contentVersion        Int      @default(1)
  content               Json
  shareToken            String?  @unique
  shareTokenExpiresAt   DateTime?                    // default 30 days from issuance
  shareTokenRevokedAt   DateTime?                    // revocation wins even if not expired
  generatedAt           DateTime @default(now())
  generatedByUserId     String
  generatedByUser       User     @relation("StakeholderReportGeneratedBy", fields: [generatedByUserId], references: [id])
  @@index([teamId, generatedAt])
  @@unique([teamId, projectId, periodStart])          // concurrent-generation guard
}
```

### Postgres CHECK constraint + trigger (migration SQL)

Executed as raw SQL in the initial migration (`prisma/migrations/000_init/migration.sql`):

```sql
-- Enforce Task.teamId matches its Project.teamId (BEFORE INSERT/UPDATE trigger)
CREATE OR REPLACE FUNCTION enforce_task_team_matches_project()
RETURNS TRIGGER AS $$
DECLARE
  project_team TEXT;
BEGIN
  SELECT "teamId" INTO project_team FROM "Project" WHERE id = NEW."projectId";
  IF project_team IS NULL THEN
    RAISE EXCEPTION 'Task.projectId % does not exist', NEW."projectId";
  END IF;
  IF NEW."teamId" <> project_team THEN
    RAISE EXCEPTION 'Task.teamId (%) must equal Project.teamId (%)', NEW."teamId", project_team;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_team_consistency
BEFORE INSERT OR UPDATE ON "Task"
FOR EACH ROW EXECUTE FUNCTION enforce_task_team_matches_project();

-- Optional belt-and-suspenders: AFTER UPDATE trigger on Task that inserts a TaskStatusEvent
-- when status changes. (We rely primarily on Prisma $extends, but this protects raw-SQL writers.)
CREATE OR REPLACE FUNCTION emit_task_status_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO "TaskStatusEvent" (id, "taskId", "teamId", "fromStatus", "toStatus", "changedByUserId", "changedAt")
    VALUES (gen_random_uuid()::text, NEW.id, NEW."teamId", OLD.status, NEW.status, NULL, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_event_emitter
AFTER UPDATE OF status ON "Task"
FOR EACH ROW EXECUTE FUNCTION emit_task_status_event();
```

## 8. Report Generation Approach

### Fact Collector (`src/server/reports/collect-task-facts.ts`)
```ts
export type TaskFacts = {
  periodStart: Date; periodEnd: Date; teamTimezone: string
  completed: Task[]; inProgress: Task[]; blocked: Task[]
  newlyCreated: Task[]; upcoming: Task[]; overdue: Task[]; slippedThisWeek: Task[]
  byProject: Map<string, { project: Project; tasks: Task[] }>
  byAssignee: Map<string, { user: User; tasks: Task[] }>
  statusTransitions: TaskStatusEvent[]
}
export async function collectTaskFacts(
  teamId: string, periodStart: Date, periodEnd: Date
): Promise<TaskFacts>
```
Boundaries are computed in `src/lib/time.ts` using **luxon** against the team's `timezone`:
```ts
// Monday 00:00 in team TZ -> next Monday 00:00 in team TZ (DST-safe)
export function weeklyPeriod(team: { timezone: string }, now: DateTime): { periodStart: Date; periodEnd: Date }
```

### Weekly Update Generator (`src/server/reports/weekly-generator.ts`)
Deterministic structured output:
```ts
export function generateWeeklyUpdate(facts: TaskFacts): WeeklyUpdateContent
// { highlights[], completed[], inProgress[], blocked[], upcoming[], narrative }
```
The structured sections are a pure function of `facts` — identical inputs yield byte-identical sections (property-tested). The `narrative` field is then passed to `polishNarrative()` (see below).

### Stakeholder Report Generator (`src/server/reports/stakeholder-generator.ts`)
```ts
export function generateStakeholderReport(
  facts: TaskFacts,
  scope: { type: 'team'|'project'; projectId?: string }
): StakeholderReportContent
```
Sections: ExecutiveSummary, ProgressSinceLast, KeyDeliverables, Risks (combines `blocked + overdue + slipped`, each with `blockedReason` where present), NextMilestones. Percent-complete bars per project (`done/total`).

### Narrative polish (`src/server/reports/narrative-polish.ts`) — LLM (Option A)
```ts
export async function polishNarrative(
  raw: string,
  facts: TaskFacts,
  teamId: string
): Promise<{ text: string; usedLlm: boolean }>
```
Behavior:
- Read `LLM_MONTHLY_BUDGET_CENTS` env (default `500` = ~$5/mo/team).
- Track monthly usage per team in a lightweight `LlmUsage` row (teamId, yearMonth, tokensUsed, centsUsed). **Postponed schema: added in Phase 3 alongside narrative polish.**
- If budget remaining AND API key present: call `claude-haiku-4-5` (or `gpt-4o-mini` fallback) with a tight prompt rewriting only the `narrative` string. `usedLlm=true`.
- On error, timeout (>3s), budget exhausted, or missing key: return `raw` unchanged. `usedLlm=false`.
- Report footer adds `AI-assisted narrative` disclosure when `usedLlm=true`.

Structured sections are NEVER passed through the LLM — only the narrative string is rewritten.

### Triggering — Weekly update cron (`/api/cron/weekly-updates`)
Rewrites per Critic requirement #5:
```ts
export async function GET(req: Request) {
  // Vercel cron header auth
  if (req.headers.get('x-vercel-cron-signature') !== process.env.CRON_SECRET) return new Response('forbidden', { status: 403 })

  const teams = await dbRaw.team.findMany({ select: { id: true, timezone: true } })
  const results = await Promise.allSettled(teams.map(async (t) => {
    const { periodStart, periodEnd } = weeklyPeriod(t, DateTime.now())
    const facts = await collectTaskFacts(t.id, periodStart, periodEnd)
    const structured = generateWeeklyUpdate(facts)
    const narrative = await polishNarrative(structured.narrative, facts, t.id)
    return dbRaw.weeklyUpdate.upsert({
      where: { teamId_periodStart: { teamId: t.id, periodStart } },       // idempotency
      create: { teamId: t.id, periodStart, periodEnd, content: { ...structured, narrative: narrative.text, usedLlm: narrative.usedLlm } },
      update: { content: { ...structured, narrative: narrative.text, usedLlm: narrative.usedLlm }, generatedAt: new Date() },
    })
  }))

  const failures = results.filter(r => r.status === 'rejected')
  failures.forEach(f => Sentry.captureException((f as PromiseRejectedResult).reason))
  // Always 200 so Vercel does not retry healthy teams
  return Response.json({ total: teams.length, failed: failures.length })
}
```

**Ceiling:** safe up to ~50 teams synchronously on Vercel Pro (60s function limit; LLM call ~2s p95). Document upgrade path: migrate to Inngest/Trigger.dev queue when team count crosses 40.

### Triggering — Stakeholder report (`/api/reports/stakeholder/generate`)
Concurrent-generation protection via unique constraint on `(teamId, projectId, periodStart)`:
```ts
try {
  return await db.stakeholderReport.create({ data: { ... } })
} catch (e) {
  if (e.code === 'P2002') {
    // Another request with the same key already created a row in the last few seconds.
    return await db.stakeholderReport.findFirstOrThrow({ where: { teamId, projectId, periodStart }, orderBy: { generatedAt: 'desc' } })
  }
  throw e
}
```

### Share link (`/app/share/[token]/page.tsx`) — token-only public route
- URL shape: `https://app/share/{32-byte-base64url-token}` — no `reportId` in URL.
- Server-side lookup: `prisma.stakeholderReport.findUnique({ where: { shareToken: token } })` (uses un-extended `dbRaw` because session is anonymous).
- **Reject if:** `shareToken == null`, `shareTokenRevokedAt != null`, or `shareTokenExpiresAt < now`.
- Default `shareTokenExpiresAt` = `now + 30 days` (configurable per report in admin UI; resolves Open Question #3).
- Response headers: `X-Robots-Tag: noindex, nofollow`.
- HTML `<head>`: `<meta name="robots" content="noindex, nofollow" />`.
- Rate limiting: `@upstash/ratelimit` sliding-window 30 req/min per IP on this route.
- Revocation endpoint: `DELETE /api/reports/stakeholder/[id]/share` sets `shareTokenRevokedAt = now()`.

## 9. Auth & Multi-Tenancy Approach

### NextAuth configuration (`src/lib/auth.ts`)
```ts
import NextAuth from 'next-auth'
import Email from 'next-auth/providers/nodemailer'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(dbRaw),                    // persists User/Account/VerificationToken ONLY
  session: { strategy: 'jwt' },                     // JWT — NOT database sessions
  providers: [Email({ server: process.env.EMAIL_SERVER! , from: process.env.EMAIL_FROM! }), Credentials({ ... })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // On sign-in, hydrate claims from DB
        const u = await dbRaw.user.findUnique({ where: { id: user.id }, select: { teamId: true, role: true } })
        token.teamId = u!.teamId
        token.role = u!.role
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.teamId = token.teamId as string
      session.user.role = token.role as 'ADMIN' | 'MEMBER'
      return session
    },
  },
})
```
Pin in `package.json`: `"next-auth": "5.0.0-beta.25"` (exact, no `^`). Phase 1 estimate raised to 2.5 days to absorb beta debugging tax.

### Single-team decision (Critic requirement #4, **Option B chosen**)
- **One user = one team.** Users wanting two teams use two email addresses.
- `User.teamId` + `User.role` remain as direct FKs on the User model.
- NO `TeamMembership` join table.
- NO `TeamSwitcher.tsx` component built.
- `requireSession()` reads `teamId` from JWT claims, never from a cookie.
- Added to Section 4 "Must NOT Have": *multi-team membership per user*.
- ADR follow-up (Section 13): migration path to `TeamMembership` post-MVP when cross-team access becomes a real request.

### Signup & invite flows
- **Signup:** `/signup` form -> server action creates `Team` (with default `timezone: "UTC"`, editable in settings) + `User(role=ADMIN)` -> sends magic link.
- **Invite:** admin at `/settings/team` enters email + role -> creates `Invite` (32-byte token, expires 7 days) -> Resend email -> accepter hits `/api/invites/accept?token=...` -> creates `User(teamId=invite.teamId, role=invite.role)`, sets `Invite.acceptedAt`, signs the user in.
- **Magic-link + password both**: Q2 resolved — Email (magic link) is primary, Credentials optional for teams that distrust magic links.

### Row-level scoping via Prisma `$extends` (Critic requirement #1)
`src/lib/db.ts` exports the tenant-scoped client used by ALL route handlers and server actions:
```ts
import { PrismaClient } from '@prisma/client'
const base = new PrismaClient()

export function makeTenantDb(session: { teamId: string }) {
  return base.$extends({
    query: {
      // Apply to each domain model: Task, Project, Invite, WeeklyUpdate, StakeholderReport,
      // TaskStatusEvent. (User is also scoped but writes are gated to admin paths.)
      $allModels: {
        async findMany({ args, query, model }) {
          if (isDomainModel(model)) args.where = { ...(args.where ?? {}), teamId: session.teamId }
          return query(args)
        },
        async findUnique({ args, query, model }) {
          const result = await query(args)
          if (isDomainModel(model) && result && (result as any).teamId !== session.teamId) return null
          return result
        },
        async findFirst({ args, query, model }) {
          if (isDomainModel(model)) args.where = { ...(args.where ?? {}), teamId: session.teamId }
          return query(args)
        },
        async update({ args, query, model }) {
          if (isDomainModel(model)) {
            args.where = { ...(args.where ?? {}), teamId: session.teamId }   // scope
            if (args.data && 'teamId' in args.data && args.data.teamId !== session.teamId) {
              throw new Error('Cross-tenant write rejected')                 // runtime assertion
            }
          }
          return query(args)
        },
        async updateMany({ args, query, model }) {
          if (isDomainModel(model)) args.where = { ...(args.where ?? {}), teamId: session.teamId }
          return query(args)
        },
        async delete({ args, query, model }) {
          if (isDomainModel(model)) args.where = { ...(args.where ?? {}), teamId: session.teamId }
          return query(args)
        },
        async deleteMany({ args, query, model }) {
          if (isDomainModel(model)) args.where = { ...(args.where ?? {}), teamId: session.teamId }
          return query(args)
        },
        async upsert({ args, query, model }) {
          if (isDomainModel(model)) {
            args.where = { ...(args.where ?? {}), teamId: session.teamId }
            const dataPairs = [args.create, args.update]
            for (const d of dataPairs) {
              if (d && 'teamId' in d && d.teamId !== session.teamId) throw new Error('Cross-tenant write rejected')
              if (d && !('teamId' in d)) (d as any).teamId = session.teamId
            }
          }
          return query(args)
        },
        async create({ args, query, model }) {
          if (isDomainModel(model)) {
            if (args.data && 'teamId' in args.data && args.data.teamId !== session.teamId) {
              throw new Error('Cross-tenant write rejected')
            }
            if (args.data && !('teamId' in args.data)) (args.data as any).teamId = session.teamId
          }
          return query(args)
        },
        async createMany({ args, query, model }) {
          if (isDomainModel(model)) {
            const rows = Array.isArray(args.data) ? args.data : [args.data]
            for (const r of rows) {
              if ('teamId' in r && r.teamId !== session.teamId) throw new Error('Cross-tenant write rejected')
              if (!('teamId' in r)) (r as any).teamId = session.teamId
            }
          }
          return query(args)
        },
      },
    },
  })
}
```

### Status-event invariant via Prisma `$extends` (Critic requirement #2)
Same `$extends` chain layered on `query.task`:
```ts
base.$extends({
  query: {
    task: {
      async update({ args, query }) {
        if (args.data && 'status' in args.data) {
          const current = await base.task.findUnique({ where: args.where, select: { status: true, teamId: true } })
          if (current && current.status !== args.data.status) {
            return base.$transaction([
              query(args),
              base.taskStatusEvent.create({ data: {
                taskId: (args.where as any).id, teamId: current.teamId,
                fromStatus: current.status, toStatus: args.data.status as any,
                changedByUserId: session.userId,
              }}),
            ]).then(([updated]) => updated)
          }
        }
        return query(args)
      },
      async updateMany({ args, query }) {
        // Fetch affected IDs first, then run updateMany + bulk-create events in a txn.
        // Implementation detail in executor handoff.
      },
      async upsert({ args, query }) { /* mirror update branch */ },
    },
  },
})
```
Belt-and-suspenders: the Postgres AFTER UPDATE trigger (Section 7) guarantees event emission even for rare raw-SQL or direct DB paths (e.g., migrations, admin scripts). The `seed.ts` script uses `dbRaw` and **explicitly** emits back-dated `TaskStatusEvent` rows so historical status transitions exist for the report engine; seed must not rely on the trigger since trigger writes `changedAt = now()` which would collapse the test fixture's timeline.

### Rate limiting (Critic requirement #10)
`src/lib/rate-limit.ts` provides per-route limiters backed by Upstash Redis:
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
const redis = Redis.fromEnv()

export const authLimiter    = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'rl:auth' })
export const inviteLimiter  = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '1 m'), prefix: 'rl:invite' })
export const signupLimiter  = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '10 m'), prefix: 'rl:signup' })
export const shareLimiter   = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'rl:share' })
```
Applied in Next.js middleware on: `/api/auth/*` (10/min), `/api/invites/accept` (5/min), `/app/signup` (5/10min), `/app/share/*` (30/min).

## 10. Acceptance Criteria -> Implementation Mapping

| AC | Implementation Touchpoints | Verification |
|---|---|---|
| AC1: Create team + invite | Signup flow, `createTeam`, `inviteMember`, `/settings/team`, `Invite` model, Resend email | Playwright: `signup-and-invite.spec.ts` |
| AC2: Create projects + tasks with assignees + due dates | `Project` + `Task` models, `/projects/new`, `/projects/[id]/tasks/new`, assignee dropdown | Playwright: `create-project-and-tasks.spec.ts` |
| AC3: Auto-generated weekly status update | `collectTaskFacts` + `generateWeeklyUpdate`, cron route with `Promise.allSettled` + upsert, `/reports/weekly` | Vitest: `weekly-generator.test.ts` + `weekly-cron.test.ts`; Playwright: `generate-weekly-update.spec.ts` |
| AC4: One-click stakeholder report | "Generate report" button, `/api/reports/stakeholder/generate`, token-only share route, PDF/Markdown export | Playwright: `export-stakeholder-report.spec.ts` |
| AC5: Reports from task data only | No text input on report generation UI; generators take `(teamId, range)` only | Unit: generator fixtures assert input contract |
| AC6: Usable without docs | shadcn/ui defaults, single primary action per page, empty-state coaching | Playwright: `non-technical-usability.spec.ts` |

## 11. Phase-by-Phase Implementation Steps

### Phase 0 — Scaffolding (est. 0.5 day)
- `pnpm create next-app@latest` (App Router, TypeScript, Tailwind, ESLint).
- Pin deps (no carets where stability matters): `prisma@5 @prisma/client@5 next-auth@5.0.0-beta.25 @auth/prisma-adapter resend nodemailer react-hook-form zod @hookform/resolvers class-variance-authority lucide-react luxon @upstash/ratelimit @upstash/redis @sentry/nextjs @anthropic-ai/sdk`.
- Install shadcn: `pnpm dlx shadcn@latest init` + primitives (`button input form card table dialog dropdown-menu badge sonner`).
- Create `docker-compose.yml` (Postgres 16 + Mailpit + optional local Redis); `.env.example` with all required keys (DATABASE_URL, NEXTAUTH_SECRET, EMAIL_*, UPSTASH_REDIS_REST_URL/TOKEN, SENTRY_DSN, ANTHROPIC_API_KEY, LLM_MONTHLY_BUDGET_CENTS=500, CRON_SECRET).
- `prisma init`, commit schema (Section 7), add raw SQL migration for CHECK trigger + status-event trigger.
- `pnpm prisma migrate dev --name init`, write `prisma/seed.ts` using `dbRaw` (one team with `timezone: "America/Los_Angeles"`, admin user, 3 projects, 15 tasks with varied statuses, explicit back-dated `TaskStatusEvent` rows).
- Configure Vitest + Playwright; CI-ready `package.json` scripts.
- **Exit criteria:** `pnpm dev` boots, `pnpm test` runs empty suite green, DB migrated, seed loads, trigger fires when a seeded task's status is updated manually via `psql`.

### Phase 1 — Auth + Multi-Tenancy (est. 2.5 days, beta debugging tax)
- `src/lib/db.ts` with `$extends` tenant scoping (Section 9) + status-event invariant layer; `src/lib/db-raw.ts` un-extended client.
- `src/lib/auth.ts` NextAuth v5 config with **JWT strategy**, Email + Credentials providers, `jwt` + `session` callbacks hydrating `teamId` + `role`.
- `src/lib/auth-session.ts` `requireSession()`; middleware gates `/app/*`.
- Pages: `/login`, `/signup` (creates team + admin), `/(app)/layout.tsx`, `/settings/team` (name, timezone picker, invite form, member list).
- Server actions: `createTeam`, `inviteMember`, `acceptInvite`.
- Email: Resend wrapper + dev fallback to Mailpit.
- Rate limiters applied to `/api/auth/*`, `/api/invites/accept`, `/app/signup` via middleware.
- **Exit criteria:** AC1 passes manually; `tests/unit/tenant/scoping.test.ts` write+read matrix green (Section 12).

### Phase 2 — Projects + Tasks CRUD (est. 2 days)
- Server modules under `src/server/projects` and `src/server/tasks` using tenant-scoped `db`.
- UI: `/projects`, `/projects/new`, `/projects/[id]` with inline task table, task create/edit dialogs, `blockedReason` field appears when status = BLOCKED.
- Task status changes now emitted by `$extends` layer (NOT by manual code); `completedAt` set in the server action when `status` -> `DONE`.
- Empty states that coach ("Create your first project to get a weekly update next Monday").
- **Exit criteria:** AC2 passes; `create-project-and-tasks.spec.ts` green; `status-event-invariant.test.ts` passes all 10 mutation shapes.

### Phase 3 — Report Engine (est. 3 days — expanded from 2 for LLM polish + timezone math)
- `src/lib/time.ts` with luxon-based `weeklyPeriod(team, now)` + DST tests.
- `collect-task-facts.ts` with full unit coverage (completed-only, blocked-heavy, overdue-heavy, empty, DST-crossing).
- `weekly-generator.ts` + `weekly-template.ts` producing `WeeklyUpdateContent` (structured sections deterministic).
- `stakeholder-generator.ts` + `stakeholder-template.ts` with TEAM and PROJECT scopes.
- `narrative-polish.ts` with Claude Haiku call, `LlmUsage` tracking row, graceful fallback; `polishNarrative()` signature frozen in Section 8.
- Add `LlmUsage` Prisma model (teamId, yearMonth unique-together, tokensUsed, centsUsed).
- UI: `/reports/weekly` (list + detail with narrative + `AI-assisted` footer when present), `/reports/stakeholder` (generate form + history + share link copy UI + revocation button).
- Route handlers: `/api/reports/weekly/generate`, `/api/reports/stakeholder/generate` (with concurrent-generation guard), `/api/reports/stakeholder/[id]/share` (POST/DELETE), `/api/cron/weekly-updates` (`Promise.allSettled` + upsert + CRON_SECRET check).
- `vercel.json` cron entry: `{ "crons": [{ "path": "/api/cron/weekly-updates", "schedule": "0 9 * * 1" }] }` (Monday 09:00 UTC; team timezone only affects period boundaries, not cron time — Q1 resolved).
- Public share route `/app/share/[token]/page.tsx` with expiry check, revocation check, `noindex` headers, rate limiting.
- **Exit criteria:** AC3, AC4, AC5 pass; all unit tests green including `weekly-cron.test.ts`, `narrative-polish.test.ts`, `period-boundaries.test.ts`; e2e `generate-weekly-update.spec.ts` + `export-stakeholder-report.spec.ts` + `share-link-expiry.spec.ts` green.

### Phase 4 — Export Formats + Polish + Sentry (est. 1.5 days)
- Markdown export: server-side render content to `.md`; `/api/reports/stakeholder/[id]/export?format=md`.
- PDF export: `@react-pdf/renderer` documents for both report types; `?format=pdf` streams; Node runtime on that route.
- Empty-state polish, toast notifications (sonner), a11y audit.
- Landing page copy + login/signup polish.
- **Sentry integration:** `@sentry/nextjs` wizard; wrap route handlers; add intentional test error at `/api/debug/sentry-test` (admin-only); verify Sentry dashboard receives it before moving to Phase 5.
- **Exit criteria:** AC6 passes via `non-technical-usability.spec.ts`; Lighthouse a11y >= 95 on core pages; Sentry captures at least one intentional test error.

### Phase 5 — Deploy + Seed Production (est. 1 day — raised from 0.5 for prod-config verification)
- Provision Neon DB, Vercel project, Resend domain, Upstash Redis, Sentry project, Anthropic API key + budget env vars.
- `pnpm prisma migrate deploy` via Vercel build step; verify trigger + CHECK exist in prod.
- Smoke test: signup -> create project -> add tasks -> trigger manual weekly update -> export stakeholder report share link from clean incognito; verify share link expires + revokes correctly; verify cron runs at 09:00 UTC Monday.
- **Exit criteria:** Production URL live, all six ACs demonstrable by a non-engineer, Sentry healthy, rate limits in place, Upstash + Neon connected.

**Total estimate:** ~10.5 working days.

## 12. Testing Strategy

### Unit (Vitest)
- `reports/weekly-generator.test.ts` — fixture-driven: empty, happy, blocked, overdue, mixed. Structured sections byte-identical on repeat runs (determinism).
- `reports/stakeholder-generator.test.ts` — team vs project scope, percent-complete math.
- `reports/collect-task-facts.test.ts` — boundary: task completed exactly at period end, status event ordering.
- `reports/narrative-polish.test.ts` — (a) budget-exhausted returns raw, (b) API error returns raw, (c) timeout >3s returns raw, (d) success path returns polished + increments `LlmUsage`.
- `reports/weekly-cron.test.ts` — (a) one team throws, others still upserted; (b) second invocation with same periodStart is idempotent (upsert not create); (c) returns HTTP 200 even with partial failures.
- `tasks/status-event-invariant.test.ts` — 10 mutation shapes (`update` with status, `update` without status, `updateMany` matching N rows, `upsert` inserting, `upsert` updating status, transaction-wrapped update, raw SQL UPDATE via `dbRaw.$executeRaw`, concurrent updates to same task, update that sets status to same value → zero events, nested update through relation) all produce exactly `{expectedCount}` events.
- `tenant/scoping.test.ts` — matrix covering read+write isolation:
  - Team A session: `findMany`, `findUnique`, `findFirst` — team B rows unreachable (empty / null).
  - Team A session: `create`, `createMany` with `teamId = teamB.id` — throws "Cross-tenant write rejected".
  - Team A session: `create` without `teamId` — auto-injects team A.
  - Team A session: `update`, `updateMany`, `upsert`, `delete`, `deleteMany` targeting team B rows — affects 0 rows.
  - Raw SQL `INSERT INTO "Task"` with mismatched `teamId`/`projectId` — Postgres trigger raises.
  - Nested create (Project with tasks) — all child teamIds auto-scoped.
- `time/period-boundaries.test.ts` — weeklyPeriod in `America/Los_Angeles` across spring-forward and fall-back DST transitions produces correct UTC instants.

### Integration (Vitest + Prisma test DB)
- `share-route.test.ts` — valid token 200; expired token 404; revoked token 404; missing token 404; response has `X-Robots-Tag: noindex, nofollow`; rate limit kicks in after 30/min.
- `cron-route.test.ts` — missing `CRON_SECRET` header 403; valid secret + 3 teams (1 failing) → 200, 1 failure logged; upsert idempotency.
- `concurrent-report-generation.test.ts` — two parallel POSTs to `/api/reports/stakeholder/generate` with identical `(teamId, projectId, periodStart)` → one row created, second request returns the same row via P2002 catch.

### E2E (Playwright)
- `signup-and-invite.spec.ts` — AC1.
- `create-project-and-tasks.spec.ts` — AC2.
- `generate-weekly-update.spec.ts` — AC3.
- `export-stakeholder-report.spec.ts` — AC4 (generate, copy share link, open in new incognito context, render OK, verify `noindex` meta tag).
- `non-technical-usability.spec.ts` — AC6.
- `share-link-expiry.spec.ts` — create report with 1-min expiry (test env override), verify accessible now, wait 65s, verify 404; revoke another report, verify immediate 404.

### Invariants (must never regress)
1. **Tenant scoping on writes:** no `create`/`createMany`/`update`/`updateMany`/`upsert`/`delete`/`deleteMany` can persist data to a team other than the session team. Matrix test in `scoping.test.ts`. Failure mode: delete or rename the `$extends` query hook → test fails.
2. **Status event on status change:** every `Task.status` mutation produces exactly one `TaskStatusEvent` row regardless of code path (Prisma update, updateMany, upsert, transaction, raw SQL). Invariant test in `status-event-invariant.test.ts`. Failure mode: remove `$extends` hook AND the Postgres trigger → test fails.
3. **Cron partial-failure tolerance:** one team's `collectTaskFacts` error must not prevent other teams from generating their update. Tested in `weekly-cron.test.ts`. Failure mode: replace `Promise.allSettled` with `Promise.all` → test fails.
4. **Report determinism:** `generateWeeklyUpdate(facts)` and `generateStakeholderReport(facts, scope)` return byte-identical structured sections (not narrative) for identical inputs. Property test over 100 fixture permutations in `weekly-generator.test.ts`.
5. **Multi-tenant read isolation:** `db` returned by `makeTenantDb(session)` must return empty results (not error) for any team A query against team B data. Verified in `scoping.test.ts`.
6. **Share link safety:** expired OR revoked tokens return 404, never 200 with data. Verified in `share-route.test.ts`.
7. **Narrative fallback:** `polishNarrative` never throws; always returns a string (possibly raw). Verified in `narrative-polish.test.ts` across all error modes.

### Manual QA checklist
- Multi-tenant sanity: two parallel signups in separate browsers see zero cross-pollution.
- Empty-week weekly update still renders a respectful "no activity this week" message.
- Share link revocation works end-to-end (generate, copy, revoke, paste → 404).
- Cron dry-run: invoke `/api/cron/weekly-updates` manually in staging with CRON_SECRET; confirm 2 teams get updates.
- Sentry test error appears in dashboard.

## 13. ADR (Architecture Decision Record)

- **Decision:** Next.js 15 App Router + Postgres 16 + Prisma 5 with `$extends` tenant scoping + status-event invariant + NextAuth v5 (JWT strategy, pinned beta) + shadcn/ui, deployed on Vercel + Neon + Upstash, with template-deterministic structured sections and LLM-polished narrative (Claude Haiku) with deterministic fallback. Single-team-per-user MVP constraint.
- **Drivers:** Time-to-MVP (4 weeks), report-generation quality from task data, non-technical usability.
- **Alternatives considered:**
  - Rails 8 + Hotwire + Kamal (B).
  - SvelteKit + Lucia + Drizzle (C).
  - `TeamMembership` join table (multi-team per user) — rejected for MVP per Section 9 decision.
  - Database sessions — rejected in favor of JWT for edge-friendliness and NextAuth v5 beta simplicity.
  - Pure deterministic narrative (no LLM) — rejected; product headline promise is "stakeholder-ready report," determinism alone falls short.
  - Proxy-based tenant scoping — rejected in favor of Prisma `$extends` (supported API, covers reads + writes; Proxy does not intercept Prisma's internal query path).
- **Why chosen:** Best weighted fit on all three drivers; `$extends` is Prisma's first-party extension API that transparently scopes every operation; JWT sessions minimize DB hops and sidestep NextAuth v5 session-adapter beta churn; LLM narrative with bounded budget protects quality without runaway cost; single-team MVP avoids migration risk inside a 4-week window.
- **Consequences:**
  - (+) Single language across stack; deterministic structured sections are unit-testable; LLM polish is a drop-in quality lever with zero test-fragility (structured sections remain deterministic).
  - (+) JWT sessions reduce DB load and make edge rate-limiting natural.
  - (+) Postgres trigger + Prisma `$extends` is defense-in-depth: either layer alone would catch tenant-leak attempts; together they're belt-and-suspenders.
  - (−) `$extends` query hooks must be maintained whenever new domain models are added — mitigated by the invariant test matrix failing loudly.
  - (−) NextAuth v5 beta pin requires a monitored upgrade path — accepted tax for best-in-class auth.
  - (−) Single-team-per-user is a known product constraint that will need migration when cross-team access is requested.
  - (−) LLM budget tracking adds a small schema + operational concern — justified by the product's headline promise.
- **Follow-ups (post-MVP, out of scope now):**
  - Migrate to `TeamMembership` join table + `current_team_id` claim when first multi-team customer appears.
  - Background job queue (Inngest / Trigger.dev) when team count crosses ~40 (cron `Promise.allSettled` stops fitting in 60s).
  - Per-team cron-time configurability (currently global Monday 09:00 UTC).
  - Billing (Stripe) when monetization direction decided.
  - GitHub / Slack / Linear integrations.

## 14. Resolved Questions (previously Open)

- **Q1 — Cron frequency configurable?** Post-MVP. Monday 09:00 UTC hardcoded; team `timezone` governs period boundaries but not fire time.
- **Q2 — Magic-link only or also password?** Both. Magic link is primary (invite flow), Credentials (password) is optional fallback for teams that distrust magic links.
- **Q3 — Share link expiry?** 30 days default; configurable per-report in admin UI via `shareTokenExpiresAt`. Revocation via `shareTokenRevokedAt` wins even when not expired.
- **Q4 — `blockedReason` on Task?** YES. Added to schema. Reports' Risks section surfaces `blockedReason` text.

## 15. Success Criteria (plan-level)

- [ ] All six acceptance criteria (AC1–AC6) demonstrated on production URL.
- [ ] Full test suite (unit + integration + e2e) green in CI, including all 7 invariant tests (Section 12).
- [ ] Cross-team isolation matrix (read + write) proves multi-tenant safety.
- [ ] Status-event invariant matrix (10 mutation shapes) proves audit-trail completeness.
- [ ] Cron partial-failure isolation test proves one team cannot break others.
- [ ] Share-link expiry + revocation behavior covered end-to-end.
- [ ] LLM narrative polish used when budget allows; graceful fallback verified.
- [ ] Sentry captures at least one intentional test error before deploy.
- [ ] A non-technical observer can reach a shareable stakeholder report within 10 minutes of first visit without docs.
- [ ] Stakeholder report content is coherent on empty, sparse, and dense task datasets (fixture-driven review).
- [ ] Total effort landed within ~10.5 working days (buffer within 4-week calendar).
