# Journal design system

Review playback is explicitly enabled even when Windows animations are disabled, as requested.
The source/export root carries `data-motion-review="play"`; the Replay control honors that
override. Remove the review attribute in production to retain ordinary reduced-motion behavior.

The Motion section includes a replayable Today specimen, composer scroll/focus and note
disclosure, complete timing and tokens, reduced-motion behavior, and route lifecycle obligations.
Motion values are scoped to `.app`; examples must use that ancestor. See `../MOTION-HANDOVER.md`
for provenance, implementation checks and the resolved scroll-fill issue.

Run `node ../scripts/build-motion.mjs` before `node build-export.mjs` when refreshing the motion
specimen. That also regenerates `../motion-index.html`  from
current numbered screens. The old v2 A5 preview is not the C3 source.

Open or export `index.html`. It is a self-contained visual and interactive reference: all
styles and behavior are embedded, so it works without this folder or a web server.

Edit `index.source.html`, not `index.html`. Then run `node build-export.mjs` to regenerate the
self-contained HTML and `components/journal-components.bundle.css`. Older component specimens describing retired tier and guest behavior have moved to the cleanup archive. See `../docs/CLEANUP-2026-10-07.md`. The guide itself makes no network requests.

`lock.css` remains the visual source of truth. `components/journal-components.js` is the
framework-neutral behavior layer, and `components/journal-components.d.ts` is its TypeScript
contract. See `components/README.md` for application integration.
