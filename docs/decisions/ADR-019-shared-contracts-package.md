# ADR-019: One Shared Package for What Crosses Between the Two Apps

**Status:** Accepted
**Date:** 2026-10-07 (Day 16)

**Amends:** ADR-001, which created the workspace on Day 1, deferred
`packages/` until a type actually needed sharing, and expected request and
response shapes to come from a generated client. The package now exists, and
the shapes in it are written by hand. The section *What ADR-001 expected*
says why.

---

## Context

Until Day 15 there was one application. Now there are two, and after a single
screen the same facts are already written in both:

| Fact | In the API | In the web app |
|---|---|---|
| The shape of an entry | the fields `JournalEntry` sends | `JournalEntry` in `lib/api.ts` |
| The shape of a day | `DayResponse` | `Day` in `lib/api.ts`, with `mood` as any string |
| The five mood words | `MOODS` in `day.entity.ts` | `MOODS` in `Journal.tsx` |
| The largest page | `MAX_PAGE_SIZE = 200` | `PAGE_SIZE = 200`, with a comment saying it was copied |
| The password minimum | `@MinLength(8)` | `PASSWORD_MINIMUM = 8` |

No check connects the two columns. The owner worked through what that means
for three of them:

- **The API lowers its page size.** Every check in both applications passes.
  The web app still asks for 200, the API answers 400, and the Today screen
  says something went wrong.
- **A mood is renamed in the web app only.** Every check passes. The API
  refuses the new word with a 400 when a user presses it.
- **The API adds a field to an entry.** Nothing fails anywhere. An interface
  does not exist at runtime, so the browser receives the field and ignores
  it. The feature is silently missing.

Today every copy is still identical. Nothing has drifted yet. The reason to
act now is that Day 17 and Day 18 make the web app *send* data for the first
time, a mood and an entry, so the number of copies is about to grow, and each
one fails without a signal.

---

## Decision

**A workspace package, `packages/contracts`, holds each of these facts once,
and both applications import it.**

The rule for what may enter is the owner's:

> The package contains facts about data crossing the boundary between the two
> apps, not implementation or behaviour belonging to either app.

| | In or out | Why |
|---|---|---|
| The shape of an entry, a day, and the signed-in user as they travel over HTTP | In | A shared data contract |
| The mood words | In | Both applications need the same allowed values |
| The largest page size, the password minimum | In | Both applications depend on them |
| TypeORM entities | Out | Database implementation belongs to the API |
| DTO classes with `class-validator` decorators | Out | Validation implementation belongs to the API |
| The web app's session module | Out | Web behaviour, not a contract |
| `dayFor` and the 4am rule | Out | The API decides which day it is (Day 15). Sharing the function would invite the browser to compute it |

Two consequences of the rule:

- **The package imports nothing.** A contract that needs a library is no
  longer only a fact.
- **The API's controllers return the contract's types.** That is what stops
  the package being a second description of the API. If an entity stops
  matching the shape the contract promises, the API fails to compile.

---

## Alternatives rejected

**Leave the copies.** Costs nothing today. Rejected because the failure is
silent in every case examined, and the copies are about to multiply.

**Generate the web app's types from an OpenAPI document.** Nest's
conventional answer and a common one. Rejected for now because it brings
decorators on every endpoint and DTO, at least two dependencies, a generation
step that must be re-run, and generated code to keep. It also does not cover
constants such as the page size, which are not part of any endpoint's shape.
That is a great deal of machinery for three shapes and three values.

**Import the API's files from the web app directly.** No new package at all.
Rejected by the owner: `day.entity.ts` is not only five words, it is
decorators, database configuration and a link to `User`, and the browser has
no business knowing any of it. It would also put TypeORM in the browser's
download.

---

## What ADR-001 expected, and what happened instead

ADR-001 said that request and response shapes should *not* be written by
hand, because a generated client does that better, and that `packages/`
should hold only shared vocabulary.

On the day the question became real, the hand-written version won. The honest
account is that ADR-001 was reasoning about an API with many endpoints and a
client that calls most of them. The web app calls five. At that size the
generator costs more than the drift it prevents.

ADR-001's argument is not wrong, and it is the first revisit condition below.

---

## Accepted costs

- **Types are checked when code is compiled, not when JSON arrives.** The
  package turns drift into a compile error. It does not validate data. An API
  that sends something other than what its types say would still be believed.
- **The rule is kept by discipline.** Nothing stops a new constant being
  written in one application and copied to the other by hand. The package
  makes the right thing possible, not mandatory.
- **Two validation messages are still matched by their text.** The web app
  recognises `email must be an email address` and the password-length message
  in order to reword them. They are sentences produced by a library and are
  not shared here.
- **A third thing to build and check.** Both applications now depend on a
  package that must be resolvable by every tool each of them uses.

---

## Revisit when

- **The web app calls enough endpoints that the contract is tedious to keep
  by hand**, or the contract and the API are found to disagree despite the
  compiler. That is the moment for the generated client ADR-001 described.
- **Something that is not a plain fact wants to enter the package**: a
  function, a class, anything with an import. That is the rule being tested,
  and the answer should be no until the rule is changed on purpose.
- **A native client is built.** It cannot import a TypeScript package, and
  that is a second argument for a generated, language-neutral contract.
