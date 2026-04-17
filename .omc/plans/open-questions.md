# Open Questions

## startup-pm-auto-reports - 2026-04-17

- [ ] Cron frequency for weekly updates — fixed Monday 09:00 UTC vs team-configurable? — Affects UX complexity and cron infra design.
- [ ] Auth providers — magic-link only, or magic-link + password? — Impacts NextAuth config and signup flow complexity.
- [ ] Share link default expiry — never, 30 days, or configurable? — Security vs UX tradeoff for stakeholder sharing.
- [ ] Blocked tasks — require a `blockedReason` field to enrich report narrative? — Schema change with narrative-quality upside.
- [ ] Monetization signal — even though billing is deferred, should we capture plan tier on `Team` now (free/paid) to avoid later migration? — Future-proofing vs YAGNI.
- [ ] LLM polish — confirm MVP is deterministic-only and `USE_LLM_POLISH` lives strictly behind a Phase-6 flag? — Avoids scope creep on report quality.
