# Restructure, part 1: folders, names, enums, strict — report

Returned by the worker as its final message on 2026-10-13 and saved by the
Master Thread (a subagent may not write report files). The audit follow-up is
recorded at the end.

## 1. What changed

All code follows *Code conventions* in `CLAUDE.md`. No behaviour changed: the
same 42 HTTP requests, with ids, times and tokens masked, gave the same status,
headers and body before and after. The contract package has a build step, and
both apps import its compiled output.

- **`packages/contracts`:** plain names (`Entry`, `Day`, `User`,
  `AuthResponse`, `CreateEntry`, `SetMood`, `Login`, `Register`); `MOODS` and
  `Mood` became one string enum `Mood`; a `tsconfig.json` compiles to
  CommonJS in `dist/` with declarations; `exports` point at `dist`; scripts
  `build` and `dev` (watch). The contract test imports `../dist/index.js`, and
  also scans `apps/web/components` and `apps/web/hooks`.
- **Root `package.json`:** a `build:contracts` script, run first by every
  script that needs the package. `typescript` 5.9.3 added as a root
  devDependency (the contract test forbids the package from having
  dependencies).
- **`apps/api/src`:** 26 files moved into `shared/{decorators,types,utils}`
  and into each module's `dto/`, `entities/`, `types/`, `guards/`,
  `decorators/`. Entities renamed `EntryEntity`, `DayEntity`, `UserEntity`,
  `SessionEntity`. New interfaces in `auth/types/` and `entries/types/`. New
  response DTOs for entries, days, users and auth; controllers return them.
- **`apps/api/tsconfig.json`:** `"strict": true`; the 23 errors fixed with `!`
  on entity columns and request DTO fields.
- **`apps/web`:** `app/components` and `app/screens` moved to
  `components/{layout,ui,day,today,timeline,auth,you,ask,talk,support,missing}/`
  and `hooks/`; `lib/api/`, `lib/utils/`; `app/styles` → `styles/`
  (`lock.css` byte for byte the same).
- **`lib/unbuilt.ts`:** `day` → `feature`, by the spec's mapping;
  `NOT_SCHEDULED` and `unscheduled()` removed; `FIRST_REAL_TEST_FEATURE = 16`.
- **Docs:** comments pointing at retired documents now point at
  `docs/features.md`; `README.md` and `docs/SETUP.md` describe the build step
  and the new layout.

## 2. Decisions and assumptions

- **CommonJS output:** the API's compiled output, ts-node (migrations) and
  Jest load CommonJS as it is; Next.js bundles either; Node's ESM loader (web
  tests, contract test) imports CommonJS with named exports. ESM output would
  break Jest and ts-node.
- **Response DTOs are built in a constructor**, so they need no `!`. Fields
  are declared in the order the JSON already had.
- **Web tests use the enum only where the compiler required it**; assertions
  still compare the literal word, which is what catches a changed value.
- **`today.ts` imports the contract's `Day` as `DayResponse`**, because the
  file has its own `Day` type.
- **Placement:** `CouldNotConnect` in `layout/`; `Journal` and `DaySheet` in
  `day/`; `Missing` and `AddressNotFound` in a new `missing/` area;
  `FULL_PAGE` beside `Page`; `DayOwner` in `days/day-boundary.ts`. End-to-end
  tests stayed in place for part 2; only their imports changed.

## 3. Checks

All nine passed. API unit 246; API end-to-end 365; contracts 7; web **170
(was 171)**. One web test was removed because it tested `unscheduled()`,
which no longer exists; "every unbuilt control is wired before a real person
tests the product" now checks every control instead of skipping some.

## 4. Mutation

`Good = 'Good'` → `'Fine'` in the contracts source: 20 API end-to-end tests
failed across 6 suites, and the mood tests in `lib/today.test.ts` failed.
Both apps read the built package. Restored. No API unit test checks a mood
word.

## 5. Browser walk

Headless Chromium (playwright-core from another project on the machine; no
dependency added), API on 3100, web on 3101, throwaway database. At 390, 820
and 1440 pixels: signed-out redirect, sign in, write, mood, delete, Timeline
list and calendar, a past day, You. All passed. The only console error was
the expected 401 of the first refresh while signed out.

## 6. Noticed, not done

- `GET /auth/sessions` and `GET /entries/count` did not return response DTOs.
  *Fixed in the follow-up.*
- Comments still name old days and phases. *Left as history.*
- The Your data comment said Markdown. *Fixed in the follow-up.*
- `env.validation.ts` keeps its interface beside its functions.
- `lib/api/api.ts` was an awkward name. *Fixed in the follow-up.*

## 7. Concepts a learner may not know

- **String enum:** a named set of values (`Mood.Good`) whose values are
  strings.
- **Type stripping:** Node 24 runs `.ts` by deleting types; an enum is code,
  so it needs a build.
- **CommonJS and ESM:** two module formats, `require`/`exports` and
  `import`/`export`.
- **`exports` in package.json:** which file a package name resolves to.
- **Definite assignment (`!`):** the property is filled outside the
  constructor.
- **`strictPropertyInitialization`:** the strict check that every property is
  set in the constructor.
- **Response DTO:** a class describing exactly what a route sends back.

## Audit follow-up (2026-10-13)

The Master Thread's audit asked for four fixes: response DTOs for the
session list and the count; `useNotBuilt` moved to `hooks/`;
`lib/api/api.ts` renamed `client.ts`; the Markdown comment corrected.
All four were made: `SessionResponseDto` and `CountResponseDto`, with the
42-request comparison identical again; `hooks/useNotBuilt.ts`;
`lib/api/client.ts`; the comment corrected. All nine checks pass at the same
counts (246 / 365 / 170 / 7), re-run by the Master Thread.

Left for her: the Export row's visible text still says "Markdown and JSON".
It is screen wording, so it was not changed; feature 6 (Your data) must make
it say PDF, JSON and audio.
