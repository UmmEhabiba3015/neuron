# Day 5 Worker Report — Strict Input, `PATCH`, and `DELETE`

**Branch:** `day-05-testing`, untouched. All changes uncommitted. No git command
was run.

> Written by the worker agent. The Master Thread's independent audit is appended
> at the end and is the authoritative verification — the worker's own numbers
> were re-run rather than trusted.

---

## Question A — how the `LIKE` pattern was escaped, and in what order

In `entries.repository.ts`, because it is a fact about how `LIKE` reads a
pattern, and that is database vocabulary:

```ts
const LIKE_ESCAPE_CHARACTER = '\\';

function escapeLikePattern(term: string): string {
  return term
    .replaceAll(LIKE_ESCAPE_CHARACTER, LIKE_ESCAPE_CHARACTER + LIKE_ESCAPE_CHARACTER)
    .replaceAll('%', LIKE_ESCAPE_CHARACTER + '%')
    .replaceAll('_', LIKE_ESCAPE_CHARACTER + '_');
}
```

with `... WHERE content LIKE ? ESCAPE '\' ORDER BY created_at DESC`.

**Order: backslash first, then `%`, then `_`.** Each later replacement
*introduces* backslashes. If the backslash pass ran last it would double the
ones just added, turning every escape marker back into a literal backslash
followed by a live wildcard:

```
correct:   '100%' --\--> '100%'   --%--> '100\%'   → pattern %100\%%   ("100", literal %)
reversed:  '100%' --%--> '100\%'  --\--> '100\\%'  → pattern %100\\%%  ("100", literal backslash)
```

So `100% exhausted today` stops matching, and entries containing `100\` start
matching instead.

**Both mistakes were introduced deliberately and the tests watched.** They fail
*differently*:

| Mistake introduced | Claims that went red |
|---|---|
| Order reversed | literal-percent, literal-underscore, `100%`. Backslash claim **still passed** |
| Backslash pass omitted entirely | **only** the literal-backslash claim |
| No escaping at all (Day 4 code) | percent, underscore and backslash — each returning *too many* |

The first draft of the code comment asserted that the backslash test catches a
reversed order. That was false, and running the mistake is what revealed it. It
catches a different mistake: escaping `%`/`_` but never the escape character,
under which a search for `\` silently returns the entry containing `%`.

---

## Question B — did the extraction actually remove the duplication?

**Yes for the rules. But the difference ADR-006 expected does not exist yet, and
the ADR should hear that.**

Extracted: `parseEntryBody` (body is an object; every field is recognised) and
`parseContent` (string / non-whitespace / verbatim). Neither rule is written
twice. `parseCreateEntryDto` and `parseUpdateEntryDto` are four lines each.

**The honest finding: those two functions are structurally identical today.**
The prompt said *"`PATCH`'s rules differ from `POST`'s in exactly one way:
`content` is optional."* That is true of `PATCH` in general and **not yet true
here**, because there is exactly **one** updatable field — so "at least one
field present" and "`content` present" are the same sentence. They differ only
in which user mistake the message describes.

What this means:

- The duplication never had room to form, so deferring `zod` holds — but for a
  **weaker reason** than ADR-006 gives. The ADR says extraction removed the
  duplication. What actually happened is that **one optional field is not a
  schema.**
- **The real test is deferred, not passed.** It arrives with a second updatable
  field (mood, Day 13), when `UpdateEntryDto` becomes `content?: …; mood?: …`
  and the two checks genuinely diverge.
- **One ADR-006 counter-argument got stronger.** The ADR notes `.strict()` is
  one word in `zod` and a key loop by hand. That loop is now written — nine
  lines plus a `RECOGNISED_FIELDS` array that a future field must be added to
  *by memory*. It is now the third rule enforced by remembering, alongside the
  `created_at` cast and the `LIKE` escaping.
- **Recommendation:** leave `zod` deferred, but treat **Day 13** rather than
  Day 12 as the likeliest trigger.

---

## Files changed

| File | Change |
|---|---|
| `entries.repository.ts` | `escapeLikePattern` + `ESCAPE` clause; `update`; `delete` |
| `entries.service.ts` | `update` / `delete` pass-throughs |
| `entries.controller.ts` | `PATCH`, `DELETE`; `parseEntryBody`, `parseContent`, `parseUpdateEntryDto`, `parseSearchTerm`; `@Query('word')` retyped to `unknown` |
| `update-entry.dto.ts` | **new** |
| `entries.service.spec.ts` | +19 tests |
| `entries.controller.spec.ts` | +14 tests |
| `test/app.e2e-spec.ts` | +8 status-code tests; `entryFrom` helper |
| `docs/master-state.md` | endpoint list, Known Debt, architecture tree |

Unit 29 → 55. E2E 10 → 18. No existing test changed or deleted.

---

## Deviations and judgement calls

1. **Added `update-entry.dto.ts`** though it is structurally identical to
   `CreateEntryDto` today. Same reasoning ADR-005 used to split `CreateEntryDto`
   from `JournalEntry`. *This is the one place I would accept being told I added
   a file too early.*
2. **`?word=` (empty) deliberately left returning everything.** The one Day 5
   gap row left open, and it is the point rather than an oversight: nobody has
   decided what an empty search term means, and implementing an unchosen
   behaviour is exactly the failure ADR-006 describes.
3. **`entryFrom(res)` helper in the e2e spec** was forced, not chosen —
   `created.body.id` is a lint error (`no-unsafe-member-access` on `any`).
   Partly repays the `res.body` debt; the three older tests were left alone.
4. **Arrays rejected explicitly** in `parseEntryBody` — without it, `["a","b"]`
   would 400 with `Unrecognised field(s): 0, 1`. Same shape as the `null` case
   Day 4 caught.
5. **`update` uses `UPDATE` + re-read** rather than `UPDATE … RETURNING`.
   Reuses `findById` and returns what the database actually holds.

## Things the prompt did not anticipate

- **`changes === 1` even when the new value equals the old**, so a `PATCH`
  setting content to what it already was is a `200`, not a `404`. Verified
  before relying on it.
- **The two escaping mistakes fail different tests.** The prompt implied one
  trap; there are two, and only both tests together cover them.

## Lessons

**Running the mistake beats reasoning about it.** A code comment asserting which
test catches a reversed escape order turned out to be wrong, and two minutes of
deliberate breakage produced something better than the original claim.

**"Extract the shared rule" and "the endpoints now differ" are separate
claims.** It would have been easy to report "duplication removed, as designed."
The decision resting on it deserves to know the difference between a rule that
was tested and one that has not yet had the chance to fail.

---
---

# Master Thread Audit

**Date:** 2026-08-05, immediately after the worker finished.
**Method:** every number below was re-run independently. Nothing was taken from
the report above.

## Checks — all re-run, not trusted

| Check | Result |
|---|---|
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm build` | ✅ |
| `pnpm test` | ✅ 55 passed |
| `pnpm test:e2e` | ✅ 18 passed |
| `apps/api/package.json` + `pnpm-lock.yaml` | ✅ unmodified — **no dependency added** |
| Boundary: no DB vocabulary in service/controller | ✅ clean |
| Boundary: no HTTP vocabulary in service/repository | ✅ clean |
| `EntryRow` confined to `entries.repository.ts` | ✅ confined |

## The three claims that mattered, verified by breaking the code

The report's claims about escape ordering were not accepted on their word. Three
mutations were introduced by the Master Thread and the suite observed each time:

| Mutation | Tests that failed |
|---|---|
| Escaping removed entirely | 3 — percent, underscore, backslash |
| Escape order reversed | 3 — percent, underscore, **and `100%`**; backslash still passed |
| Backslash pass omitted only | **1** — backslash only |

**The worker's account is accurate**, including the non-obvious part: a reversed
order does *not* fail the backslash claim, and omitting the backslash pass fails
*only* that claim. The two mistakes are genuinely distinguished by the suite,
which is stronger coverage than the prompt asked for.

**The `only` claims fail on too many, not on none** — verified by reading the
actual failure output:

```
- Expected  - 0
+ Received  + 3
  Array [
+   "has-none",
+   "has-backslash",
+   "has-underscore",
    "has-percent",
  ]
```

`has-percent` is still present. The test fails purely because three others came
with it. This is exactly what the word `only` was added to buy, and it works.

## Live HTTP, fresh database on port 3997

| Request | Result | Wanted |
|---|---|---|
| `POST {"content":"x","id":"mine"}` | 400 | 400 ✅ |
| `POST {"content":"a plain evening"}` | 201 | 201 ✅ |
| `GET ?word=a&word=b` | 400 | 400 ✅ |
| `GET ?word=%` | 1 entry — `100% exhausted today` | literal ✅ |
| `GET ?word=_` | 1 entry — `named it snake_case` | literal ✅ |
| `GET ?word=\` | 1 entry — `path was C:\temp` | literal ✅ |
| `GET ?word=100%` | 1 entry — `100% exhausted today` | literal ✅ |
| `PATCH {"contnet":…}` | 400 | 400 ✅ |
| `PATCH {}` | 400 | 400 ✅ |
| `PATCH {"content":42}` | 400 | 400 ✅ |
| `PATCH {"content":"   "}` | 400 | 400 ✅ |
| `PATCH` unknown id | 404 | 404 ✅ |
| `PATCH` valid | 200 | 200 ✅ |
| `DELETE` valid | 200, returns the entry | 200 ✅ |
| `GET` after delete | 404 | 404 ✅ |
| `DELETE` twice | 404 | 404 ✅ |
| `DELETE` unknown id | 404 | 404 ✅ |

**`createdAt` unchanged across a successful `PATCH`** — confirmed byte-identical
before and after (`2026-08-04T19:39:31.013Z`).

**Content stored verbatim across the update path** — `'   edited but still
padded   '` went in and came back with its spaces intact.

**Regressions** — `GET /entries` 200 · `/count` 200 · `/nope` 404 · `POST {}`
400 · `?word=zzzzz` 200. All unchanged.

## Audit findings

**Accepted, and ADR-006 amended because of it:** the worker's Question B answer
is correct and it corrects the ADR. ADR-006 justified deferring `zod` partly on
"the extraction removed the duplication." The truthful version is that **one
optional field is not a schema**, so the duplication never had room to form. The
ADR has been amended, and the likeliest trigger moved from Day 12 to **Day 13**.
A worker that reports a weaker version of its own success is doing the job
correctly.

**Accepted:** `update-entry.dto.ts` added despite being identical to
`CreateEntryDto` today. The worker flagged this itself as its most questionable
call. It follows ADR-005's own precedent for splitting `CreateEntryDto` from
`JournalEntry`, and naming a `PATCH` body a *Create* DTO would be the same kind
of false label ADR-005 removed. Kept.

**Accepted:** `?word=` (empty) still returns everything. Leaving an undecided
behaviour unimplemented is correct under ADR-006's own reasoning. It remains
open debt and is material for a future session.

**No defects found.** No rework required.
