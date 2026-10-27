# ADR-026: Component Tests Run on a Simulated Page — Vitest, React Testing Library and user-event on jsdom

**Status:** Accepted
**Date:** 2026-10-26 (feature 7, Quality pass)

---

## Context

The web app's tests run only the files in `lib/`, with Node's own test
runner. No test renders a React component. In feature 1 she removed
`event.preventDefault()` from the Enter handler of the composer: Enter saved
the entry and also left a new line in the box, and all 202 web tests passed.
That an unbuilt control sends nothing, and the links between screens, are
also checked only by a worker walking the app.

---

## Decision

- **Component tests** render a real component into **jsdom**, a page
  simulated inside Node, and act on it with **React Testing Library** and
  **user-event**. **Vitest** runs them, because Node's own runner cannot read
  the JSX in `.tsx` files.
- **The existing tests in `lib/` stay on Node's runner, unchanged.**
  `pnpm test:web` runs both suites.
- **Layout is not tested.** jsdom does not compute where anything is drawn.
  The worker's walk at phone, tablet and desktop widths stays responsible
  for layout.

Her choice, 2026-10-26.

---

## The evidence

An experiment outside the repository, a text box that saves on Enter and
calls `preventDefault()`, was tested two ways, with and without that line:

| | With the line | Without it |
|---|---|---|
| Enter pressed with **user-event** | passes | **fails**: the box holds `'hello\n'` |
| Enter pressed with **fireEvent** | passes | passes |

fireEvent only dispatches the event; nothing acts on it. user-event copies
the browser: after the key event it checks whether the default was
prevented, and if not, it inserts the new line itself. Her prediction was
that a simulated test would miss the bug. It holds for fireEvent and not for
user-event. **So component tests press keys and click with user-event, not
fireEvent.**

---

## Alternatives

| Option | For | Against |
|---|---|---|
| **Vitest, Testing Library and user-event on jsdom** (chosen) | Fast; runs inside `pnpm test:web`; catches every gap we have evidence for | An imitation: it catches only what user-event copies from browsers; no layout |
| **Playwright** in a real browser | Sees everything, layout included | Seconds per test; the API and the web app must be running; a second kind of test to keep up; nothing found so far needs it |
| **Both**, Playwright replacing the walk by hand | Layout checked by a machine | The costs of both, before a failure asks for them |

---

## Accepted costs

- Three to five new development dependencies, and a second test runner in
  `apps/web`.
- A behaviour that user-event does not imitate, and any fault of layout,
  passes these tests. The walk at three widths is the only check of layout.

---

## Revisit when

- A fault that only a real browser shows (layout, real focus, a browser
  difference) gets past a worker's walk. Then Playwright, for that flow.
- The two runners in `apps/web` cost more than moving the `lib/` tests to
  Vitest would.
