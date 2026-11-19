# ADR-029: The Redraw — Screens Rebuilt on the Designer's Reusable Components

**Status:** Accepted (Umer, 2026-11-19). Decided in
the v4 reconciliation by Umer, with Habiba and the designer (rows 34 to 40;
follow-up Q4, Q5 and Q7; `docs/learning/reconciliation-v4/rulings.md`).

---

## Decision

Before any new feature, the web app's screens are rebuilt from the bottom up
on React components that mirror the designer's v4 modules, on v4's
stylesheet. Logic and the API do not change.

- **Layers mirror the designer's.** His layout primitives go in
  `components/layout/`, his components in `components/ui/`, his sections in
  `components/<area>/`, and his pages become each area's screen, rendered by
  `app/**/page.tsx`. One React component per module, its props taken from
  his contract and generated types (`designs/AIJournal-v4/dist/`).
- **Built from the bottom:** the stylesheet and tokens, then layout, then
  components, then sections, then screens.
- **Only what is built is redrawn.** A feature that is not built is not
  drawn and has no menu item; it adds its own components when it is built.
  `apps/web/lib/unbuilt.ts` and "This is not built yet." are retired.
- **The stylesheet** is v4's `dist/system.css`, copied into
  `apps/web/styles/` and never edited. The app's additions stay in
  `live.css`. Anything missing is reported to the designer, not patched in
  his file.
- **Behaviour is written in React.** The designer's scripts
  (`dist/system.js`, the module scripts) are never run.
- **Public and private routes** each get a Next.js route group, so the
  public pages can be served as plain HTML from the server and the private
  ones can never be indexed.

## Problem

The app's screens were built by hand on v3's single 475 KB stylesheet.
Almost nothing is reusable: `components/ui/` holds one file, the raw `btn`
class is written 45 times across 13 files, and `components/day/` alone is
1,410 lines. v4 rebuilt the design as 70 modules (6 layout primitives, 39
components, 12 sections, 13 pages), each with a contract, and its stylesheet
no longer has **75 of the 121 classes** the app uses. Moving to v4 means
redrawing almost every screen whatever is chosen.

## Alternatives

1. **Keep v3's stylesheet** and build new features on v4 beside it. Two
   stylesheets define the same tokens and elements, and fight.
2. **Redraw each screen when its feature is next touched.** The app would
   carry both designs for months, and the screens no feature touches would
   never move.
3. **Load the designer's runtime (`system.js`)** and render his markup.
   It changes the page behind React's back, which React then overwrites.
4. **One redraw, bottom up, on components that mirror his** (chosen).

## Pros

- Each piece of the design is written once and reused, so a change to a
  button changes every button.
- The components' names and props match the designer's, so a new screen from
  him maps to code directly.
- `lib/` and the API keep their tests (613 API unit, 72 API end-to-end, 318
  web `lib/`), which guard behaviour while only the drawing changes.
- The stylesheet is smaller (328 KB against 623 KB for v4's `lock.css`).

## Cons

- A large feature with no new behaviour for the person using it.
- `system.css` may lack something `lock.css` had; that is found only by
  drawing every screen and comparing it.
- Component tests are rewritten with their components.

## Tradeoffs

The redraw costs time now so that every later feature is built once, on
the new design. Habiba learns reusable components on one complete example (a
button up to a section), in at most one day of work; workers do the rest
(row 39).

## Future revisit conditions

- **The designer's modules change shape** in a later delivery: the mirrored
  components follow his contract versions.
- **`system.css` proves incomplete** in a way he cannot fix quickly: v4's
  `lock.css` is the fallback.
- **The native app starts:** the components are web-only, and the contracts
  are what a second client would share.
