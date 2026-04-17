# Deep Interview Spec: Startup PM Tool with Auto-Generated Reports

## Metadata
- Interview ID: di-001
- Rounds: 8
- Final Ambiguity Score: 14.3%
- Type: greenfield
- Generated: 2026-04-17
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.92 | 40% | 0.368 |
| Constraint Clarity | 0.75 | 30% | 0.225 |
| Success Criteria | 0.88 | 30% | 0.264 |
| **Total Clarity** | | | **0.857** |
| **Ambiguity** | | | **14.3%** |

## Goal
Build a simple web-based project management tool for small startups (2–20 people) that eliminates the manual overhead of status reporting. Teams manage tasks directly in the app; the app automatically generates weekly status updates and one-click stakeholder progress reports from that task data — no integrations required for MVP.

## Constraints
- **Target audience:** Small startups, 2–20 people
- **No integrations in MVP:** Teams enter tasks manually; no GitHub/Slack/Linear sync
- **Simpler than Jira/Linear/Asana:** Deliberately minimal UX, low learning curve
- **More affordable than existing tools:** Pricing is a future concern; monetization deferred
- **Multi-tenant architecture:** Design for team isolation from day one, but no payment processing yet
- **Web app:** Browser-based, no native mobile app required for MVP
- **Report generation is core:** Everything else (task management UI, dashboards) exists to feed the report engine

## Non-Goals
- GitHub, Slack, Linear, or any third-party integrations (MVP)
- Mobile native app
- Payment processing or subscription billing (MVP)
- Time tracking
- Advanced sprint planning / velocity charts
- Real-time collaboration / multiplayer cursor features

## Acceptance Criteria
- [ ] A user can create a team workspace and invite teammates
- [ ] A user can create projects and add tasks with assignees and due dates
- [ ] After a week of task activity, the app auto-generates a weekly status update summary (no manual writing required)
- [ ] A founder/admin can export or share a stakeholder-ready progress report in one click
- [ ] The weekly update and stakeholder report are generated from task data — no manual input needed beyond task management
- [ ] The app is usable by a non-technical team member without onboarding documentation

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| Teams need a full task manager | Could they just import from GitHub/Linear? | No — teams enter tasks manually; the app IS the task manager |
| Deep integrations are essential | What if they're optional? | Integrations are cut from MVP; manual entry is the starting point |
| The product needs monetization design now | What if monetization is a later problem? | Deferred; design for multi-tenancy without billing for now |
| Users need both report types from day one | What if one report type is enough to ship? | User confirmed both weekly update + stakeholder report are the MVP core |

## Technical Context
Greenfield project — no existing codebase. Suggested stack considerations:
- Multi-tenant SaaS architecture (team-scoped data isolation)
- Report generation engine (transform task state → prose/structured report)
- Simple auth (email/password or magic link — OAuth optional)
- No queue/worker complexity needed for MVP (report generation can be synchronous)

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Team | core domain | name, slug, members | has many Projects, has many Users |
| User | core domain | name, email, role (admin/member) | belongs to Team, assigned Tasks |
| Project | core domain | name, description, status, deadline | belongs to Team, has many Tasks |
| Task | core domain | title, description, assignee, due_date, status, completed_at | belongs to Project |
| WeeklyUpdate | supporting | generated_at, content, period_start, period_end | belongs to Team, derived from Tasks |
| StakeholderReport | supporting | generated_at, content, format (PDF/link), project_scope | belongs to Team or Project, derived from Tasks |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 2 | 2 | - | - | N/A |
| 2 | 3 | 1 | 0 | 2 | N/A |
| 3 | 4 | 1 | 0 | 3 | N/A |
| 4 | 4 | 0 | 1 | 3 | 75% |
| 5 | 5 | 1 | 0 | 4 | 80% |
| 6–8 | 5 | 0 | 0 | 5 | 100% |

## Interview Transcript
<details>
<summary>Full Q&A (8 rounds)</summary>

### Round 1
**Q:** Tools like Jira, Linear, Asana, and Monday.com already exist. What specific problem are you solving that they don't — or who is the specific user you're building for that those tools fail?
**A:** A specific pain point (reporting, cost, complexity)
**Ambiguity:** 88% (Goal: 0.30, Constraints: 0.00, Criteria: 0.00)

### Round 2
**Q:** Which pain point is it most centrally about — reporting, cost, or complexity?
**A:** Cost (too expensive) + Complexity (too hard to use) — both
**Ambiguity:** 80% (Goal: 0.45, Constraints: 0.05, Criteria: 0.00)

### Round 3
**Q:** Who is the primary user who feels these pains most acutely?
**A:** Small startups (2–20 people)
**Ambiguity:** 71% (Goal: 0.65, Constraints: 0.10, Criteria: 0.00)

### Round 4 — ⚡ Contrarian Mode
**Q:** Small startup teams often use Slack + Google Sheets. What specifically would make them adopt and stick with your tool?
**A:** It saves them time they currently lose to manual work
**Ambiguity:** 52% (Goal: 0.78, Constraints: 0.20, Criteria: 0.35)

### Round 5
**Q:** What specific manual work disappears when someone uses your app?
**A:** Writing weekly status updates + Creating progress reports for stakeholders
**Ambiguity:** 38% (Goal: 0.85, Constraints: 0.35, Criteria: 0.60)

### Round 6 — 🔧 Simplifier Mode
**Q:** If you had to ship in 4 weeks, what would you cut — integrations, task manager, or reporting?
**A:** Keep the reports, cut the integrations — manual task entry is fine, reporting is core
**Ambiguity:** 23.5% (Goal: 0.90, Constraints: 0.65, Criteria: 0.70)

### Round 7
**Q:** How does this product make money, and where does it live?
**A:** Not decided yet — build the product first
**Ambiguity:** 21% (Goal: 0.90, Constraints: 0.72, Criteria: 0.72)

### Round 8
**Q:** What must a 5-person team be able to DO after one week to call the MVP a success?
**A:** Receive an auto-generated weekly status update + Export/share a stakeholder report
**Ambiguity:** 14.3% (Goal: 0.92, Constraints: 0.75, Criteria: 0.88)

</details>
