# The Neuron Handbook

**What this is.** The constitution says code explains *how* and documentation
explains *why*. The ADRs hold the why for one decision at a time. This holds
the why across decisions — the arguments that only make sense once you have
seen several of them together.

**What this is not.** Not a tutorial, not API reference, and not a summary of
the code. If a section here could be replaced by reading the source, it should
be deleted.

**How it is written.** One entry per phase, written on that phase's review day
while the reasoning is still recoverable. Each entry answers: what problem did
this phase exist to solve, what was decided, what was got wrong first, and what
the next phase inherits.

| Entry | Phase | Written |
|---|---|---|
| [Phase 1 — The Request](phase-1-the-request.md) | Days 2–7 | Day 14, late |
| [Phase 2 — Identity and Ownership](phase-2-identity-and-ownership.md) | Days 8–14 | Day 14 |

**Phase 1's entry is late and says so.** The roadmap scheduled it for Day 7 and
it was not written. It is reconstructed on Day 14 from the ADRs, the worker
reports and the git history, which is a worse source than memory would have
been a week earlier. That cost is the entry's own first lesson.

---

## The five questions the project is organised around

From the roadmap. Each phase exists to answer one, and each answer creates the
problem the next one solves.

1. **Can I store and retrieve a thought?** — Phase 1, Days 2–7
2. **Whose thought is it?** — Phase 2, Days 8–14
3. **Can a person actually use this?** — Phase 3, Days 15–20
4. **Can I find a thought I half-remember?** — Phase 4, Days 21–27
5. **What do my thoughts mean together?** — Phase 5, Days 28–39

## The decisions, in one table

| | Decision | Still standing? |
|---|---|---|
| [ADR-001](../decisions/ADR-001-monorepo.md) | A pnpm workspace monorepo | Yes. Earned on Day 12 when `apps/web` arrived |
| [ADR-002](../decisions/ADR-002-nestjs.md) | NestJS for the API | Yes |
| [ADR-003](../decisions/ADR-003-sqlite.md) | SQLite for persistence | Yes, with a stated expiry: Postgres on Day 31 |
| [ADR-004](../decisions/ADR-004-repository-raw-sql.md) | A data-access layer, hand-written SQL | Half. The layer stands; the hand-written SQL was replaced by ADR-010 |
| [ADR-005](../decisions/ADR-005-validation-and-error-semantics.md) | Status codes live in the controller | Yes, and reconfirmed by ADR-017 |
| [ADR-006](../decisions/ADR-006-strict-input-and-mutation-semantics.md) | Reject unknown input; `PATCH`/`DELETE` semantics | Yes |
| [ADR-007](../decisions/ADR-007-configuration-and-boot-validation.md) | Configuration checked once, at boot | Yes |
| [ADR-008](../decisions/ADR-008-validation-library-and-global-pipe.md) | `class-validator` and a global pipe | Yes |
| [ADR-009](../decisions/ADR-009-identity-jwt-and-ownership-model.md) | Entries belong to users; a signed token carries identity | Amended by ADR-014, which answered its stated costs |
| [ADR-010](../decisions/ADR-010-typeorm.md) | TypeORM, replacing hand-written SQL | Yes |
| [ADR-011](../decisions/ADR-011-password-storage.md) | argon2id, never recoverable | Yes |
| [ADR-012](../decisions/ADR-012-authentication-endpoints.md) | Registration, login, how a request is identified | Amended by ADR-016: the identifier is now an email |
| [ADR-013](../decisions/ADR-013-ownership-enforcement.md) | Ownership enforced in the query | Yes |
| [ADR-014](../decisions/ADR-014-sessions-and-revocation.md) | Sessions, refresh tokens, real revocation | Yes |
| [ADR-015](../decisions/ADR-015-the-day-is-the-aggregate.md) | The day is the aggregate, not the entry | Yes |
| [ADR-016](../decisions/ADR-016-design-alignment.md) | Aligning the API with the designs | Yes |
| [ADR-017](../decisions/ADR-017-counting-a-filtered-collection.md) | Counting a filtered collection | Yes |
