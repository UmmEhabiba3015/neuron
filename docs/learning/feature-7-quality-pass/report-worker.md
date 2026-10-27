# Feature 7, Quality pass: the worker's report

Spec: `docs/workers/feature-7-quality-pass.md`. Saved by the Master Thread
on 2026-10-27, as the worker returned it.

## 1. What changed
I added component tests on jsdom (Vitest, React Testing Library, user-event), using exact versions. `pnpm test:web` now runs Node's suite for `lib/` first and then Vitest, joined with `&&`, so it fails if either fails. `lib/utils/clock.ts` is now the only file that reads the clock, and lint enforces that. I fixed the rail on Talk, the counts on Your data at 390, and the timezone listed twice. The fourth fault, the entry icons, did not show up in testing; see 2. In `apps/web`:
- `package.json`: 4 dev dependencies, `test` = `test:lib && test:components`
- `vitest.config.mts`: jsdom, `components/**/*.test.tsx`, `@/` alias, a placeholder API URL
- `test/setup.ts`: stubs `matchMedia` (answer: not touch-only) and `scrollTo`; runs cleanup (unmount) and resets the stubs after each test
- `test/fake-api.ts`: replaces `fetch` and records every request
- `components/today/LiveToday.test.tsx`: the 5 tests from the spec (composer ×3, editor, unbuilt control)
- `lib/utils/clock.ts`: `timezoneLabelNow`, `timezoneChoicesNow`, `systemClock` (reads `performance.now()`)
- `lib/recorder.ts`, `components/talk/Talk.tsx`, `components/you/You.tsx`: the four clock reads now go through `clock.ts`
- `eslint.config.mjs`: `no-restricted-syntax` forbids `new Date()` and `Date.now` everywhere except `clock.ts`; the message names ADR-015
- `lib/timezone.ts` and its test: `browserZoneName`, `TimezoneChoice.chosen`, compare by the browser's own name; Kolkata/Calcutta cases
- `lib/your-data.ts` and its test: `countsParts` replaces `countsLine`; `components/you/YourData.tsx` draws each count in its own span
- `styles/live.css`: 3.1 (Talk's rail) and 5.8 (counts stay whole). `lock.css` is untouched.

## 2. Decisions and assumptions
- **Entry icons not fixed.** I could not make the fault appear: no rule added. I measured text against icons in Chromium and Firefox at 390 to 1920 wide, with and without an emulated mouse, with long, unbroken and multi-line entries, on Today and on a past day. The overlap was always zero, and `lock.css`'s grid already keeps them apart. Please give me the steps that show it.
- `@vitejs/plugin-react` was not needed: Vitest compiles the JSX itself. `@testing-library/dom` came in automatically as a peer of Testing Library and is not in `package.json`. All the new packages are MIT.
- `timezoneChoices` takes an optional `nameOf` so a test can stand in for Firefox. Node, which runs the tests, names the zone `Asia/Calcutta` as the API does.
- The Timezone screen opens on the browser's name. Saving `Asia/Kolkata` worked, and the API answered with `Asia/Calcutta`.
- The rail fix restates `lock.css`'s `.device:is(.t,.d) .compact-recorder-app>.rail{left:0}` on the 700 width.
- `countsLine` had no other users, so `countsParts` replaces it.

## 3. Checks
All nine pass: lint, typecheck, build, test (663 Jest + 10 contracts), test:e2e (68 tests, 22 suites; it passed on the first run), lint:web, typecheck:web, build:web, test:web. The two web suites: Node `lib/` 290 passed (was 285), Vitest 5 passed.

## 4. Mutation
I removed `event.preventDefault()` from `components/day/enterToSaveHandler.ts`. "the composer on Today › Enter saves the entry and leaves no new line in the box" failed: the box held `'A quiet morning\n'`. Then I restored the line. The editor test still passed under this mutation: the editor turns read-only while it saves, so user-event types no new line.

## 5. Browser walk
Headless Chromium and the system Firefox, driven by puppeteer-core installed in the scratchpad (not the repo). Throwaway database in `/tmp/neuron-worker7`, API on 3100, web on 3101. I walked Talk, Your data, Timezone and Today's entry rows at 390, 834 and 1440:
- **Talk:** the rail now sits at the left edge at tablet and desktop.
- **Your data at 390:** the counts read "5 entries," then "1 recording" on the next line.
- **Firefox Timezone, saved `Asia/Calcutta`:** one option, `Asia/Kolkata (UTC+5:30)`, selected; Save returns to Account.
- **Entry rows:** no overlap at any width.

## 6. Noticed, not done
- **Chromium, 1200 to about 1229 wide:** Today's whole layout collapses into a 360px column. Firefox at 1200 does not.
- **`lock.css` 3405:** `.device:not(.d) .recorder-mast` (Talk's header stays in place when scrolled) is still keyed on `.device`.
- **`live.css` header:** it still says "Four things" for section 5.
- **`pnpm-lock.yaml`:** the peer resolution of the Nest CLI changed slightly, because Vite brings in postcss.
- **`@types/node`:** Vitest wants version 22 or later, and the web app has 20.
- **Before I started:** `docs/master-state.md` was already modified; I did not touch it.

## 7. Concepts a learner may not know
- **jsdom:** a browser page imitated inside Node: it has a DOM and events, but draws nothing.
- **`vi.stubGlobal`:** swaps a global such as `fetch` for one test and puts it back afterwards.
- **`performance.now()`:** milliseconds since the page opened; changing the device clock does not move it.
- **`resolvedOptions().timeZone`:** the name this browser itself uses for a zone, so one zone with two spellings can be matched.
- **`white-space: nowrap`:** the text inside is never broken across lines.
- **Container query:** a style rule that depends on the width of an ancestor element, not of the window.

## The Master Thread's audit

The diff matches the spec and `git status --short` matches the file list.
The lint rule has the two selectors and one exception; `clock.ts` returns
text and a duration clock only, and the recorder only subtracts two
readings of it. `lock.css` untouched. The nine checks re-run once before
the commit: 663 API unit, 68 API end-to-end, 10 contract, 290 web `lib/`,
5 component tests. No follow-up worker needed.
