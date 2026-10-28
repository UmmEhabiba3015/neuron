# Worker report: feature 9, Keep out of memory

Spec: `docs/workers/feature-9-keep-out-of-memory.md`. Saved by the Master
Thread on 2026-10-28.

**1. What changed**
An entry or memo can now be kept out of memory at save time, using a tick on the composer or on Talk. `PUT /entries/:id/memory` puts it in memory, one way only. The row's menu shows the mark. A kept-out entry's one option asks first and then waits for the API.
- API: `entry.entity.ts` (new column), `migrations/1793174439276-KeptOutOfMemory.ts` (generated, reformatted, added to `migrations/index.ts`), `create-entry.dto.ts`, `create-voice-memo.dto.ts` (exact "true"/"false"), `entry-response.dto.ts`, `entries.repository.ts` (`putInMemory`, owner and `deletedAt` in the WHERE), `entries.service.ts`, `entries.controller.ts` (the PUT route), `export.repository.ts`.
- Contracts: `Entry.keptOutOfMemory`, plus an optional field on `CreateEntry` and `CreateVoiceMemo`.
- Web: new `lib/memory.ts` (words, menu view, Talk's tick store); `lib/today.ts` (composer tick, ask/keep/use-in-memory); `lib/uploads.ts` (form field, same choice on retry); `Journal.tsx`, `DaySheet.tsx`, `LiveToday.tsx`, `Talk.tsx`; `live.css` 5.9; `lib/unbuilt.ts` (two entries removed).
- Tests: new `keep-out-of-memory.spec.ts`, `kept-out-of-memory.migration.spec.ts`, `test/entries/keep-out-of-memory.e2e-spec.ts`, `lib/memory.test.ts`. Updated the baseline spec (now undoes every migration), the DTO, response, export, PDF and ownership specs, four e2e specs, `today.test.ts`, `uploads.test.ts`, `LiveToday.test.tsx` and `fake-api.ts`.

**2. Decisions and assumptions**
- A JSON `null` for `keptOutOfMemory` is a 400 (`ValidateIf` rather than `IsOptional`). The composer always sends the field, so `false` is sent too.
- A PUT answered 404 takes the row off the page and reuses the existing sentence, "That entry had been deleted somewhere else, so your change was not saved."
- After "Use in memory" is confirmed, the question closes and focus goes back to the trigger. The option stays disabled until the API answers.
- The PDF is unchanged (decision 3a), and a test shows that.
- Every new sentence on screen, word for word:
  - Trigger: "In memory" / "Kept out of memory". `aria-label`: "Entry memory settings: in memory", "Entry memory settings: kept out of memory", and the same with "Voice memo" in place of "Entry".
  - Menu of an entry in memory: "This entry is in memory." / "This voice memo is in memory."
  - Option, and the confirm button: "Use in memory". Safe answer: "Keep it out".
  - Question: "Use this entry in memory? This cannot be undone." / "Use this voice memo in memory? This cannot be undone."
  - While waiting: "Putting it in memory."
  - Heard only by a screen reader: "This entry is in memory now." / "This voice memo is in memory now."
  - Failed: "We could not reach the server. The change was not saved. This entry is still kept out of memory." / "Something went wrong on our side. The change was not saved. This entry is still kept out of memory." (or "This voice memo is still kept out of memory.")
  - The tick on Talk: "Keep this out of memory".

**3. Checks**
- lint, typecheck and build passed.
- test passed: contracts 10, API 52 suites / 613 tests.
- test:e2e: 72 tests in 23 files, with one flaky test. Of five full runs, three passed fully; in the other two, one forgot-password test failed ("no reset link was written to the log"). That file passed every time alone.
- lint:web, typecheck:web and build:web passed.
- test:web passed: lib 317, components 6.

**4. Mutation**
Removed `userId` from `putInMemory`'s WHERE. Two tests failed: "putInMemory › finds nothing of another person's, and leaves it kept out" (unit) and "is a 404 for another person's entry…" (e2e). Restored.

**5. Browser walk**
Today, a past day (seeded) and Talk at 390, 768 and 1440 with headless Chromium (playwright-core in the scratchpad only). At each width: the tick was sent and turned off after saving; a memo recorded with the tick showed as kept out, and Talk's tick was off on return; the question focused "Keep it out", and confirming put the entry in memory and announced it; an entry in memory offered no option; the failed state worked (API stopped at 1440, request failed in the browser at 390 and 768); no width scrolled sideways.

**6. Noticed, not done**
- Recording a voice memo is broken, separately from this feature. The recorder's clock is `performance.now()`, which gives fractions, so a fractional `durationMs` reaches the API and gets a 400. The walk got past it by rounding the clock inside the walk script. A fix would round in `lib/recorder.ts`.
- The forgot-password e2e helper waits a fixed 1000 event-loop turns, which runs out when test files run in parallel.
- On desktop, a memo with no words has a tall empty body under its trigger.

**7. Concepts a learner may not know**
- Idempotent: the same request twice leaves the same result and gets the same answer.
- `aria-pressed`: tells a screen reader whether a toggle button is on.
- Live region (`role="status"`): text a screen reader reads aloud when it changes.
- `@Transform`: changes a value before it is checked; used because `@Type(() => Boolean)` turns "false" into true.
- `affected` in Postgres counts the rows the WHERE matched, even when nothing changed.

## Master Thread's audit (2026-10-28)
- The API keeps the one-way rule: `putInMemory` only writes `false`, with the
  owner and `deletedAt` in the WHERE; PATCH refuses the field.
- A retried upload keeps the memo's choice (`uploads.ts`).
- **Found:** `Talk.tsx` line 79, `uploads.keep(memo, tick.take())`, is the
  one line that carries Talk's tick to the upload, and nothing guards it.
  With `tick.take()` removed, all 317 lib tests, 6 component tests and the
  typecheck still passed, because `keep`'s parameter defaults to `false`,
  which is the direction that cannot be undone.
- The fractional `durationMs` explains why recording worked for her
  (Firefox rounds `performance.now()` to whole milliseconds) and failed in
  the worker's Chromium. It dates from feature 7's clock file.

# Follow-up worker report (2026-10-28)

Spec: `docs/workers/feature-9-follow-up.md`, from the audit.

- **Talk's tick is required:** `keep(memo, keptOutOfMemory)` in
  `lib/uploads.ts` has no default. Dropping `tick.take()` from `Talk.tsx`
  line 79 now fails the typecheck: `TS2554: Expected 2 arguments, but got 1.`
  The uploads test's duplicate case was replaced by one memo with `false` and
  one with `true`.
- **A memo's length is whole milliseconds:** `lib/recorder.ts` rounds once,
  kept between 1 and the limit. New test: a clock moving 1234.567 ms then
  0.6 ms keeps exactly 1235 ms; without the rounding it fails.
- **Walk:** Chromium at 1280, real `performance.now()` (697.1000000014901);
  a memo recorded with the tick on was answered 201 with
  `"durationMs":1612,"keptOutOfMemory":true` and shown kept out on Today.
- **Checks:** all nine passed; 613 API unit, 72 end-to-end (on a rerun:
  `main.e2e-spec.ts` "has swept the audio folder" failed once), 318 web lib.
- **Noticed:** `main.e2e-spec.ts` stays flaky on timing, as does the
  forgot-password e2e test.
