# Journal design system

The delivered guide follows the device's reduced-motion setting: with reduced motion on, the
specimens and Replay stay still. On the designer's computer the build adds a review switch,
`data-motion-review="play"` on the root, so motion can be reviewed with Windows animations off;
`scripts/package-handover.mjs` removes it from delivered copies. Never ship it in the product.

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
self-contained HTML and `components/journal-components.bundle.css`. The guide itself makes no network requests.

`lock.css` remains the visual source of truth. `components/journal-components.js` is the
framework-neutral behavior layer, and `components/journal-components.d.ts` is its TypeScript
contract. See `components/README.md` for application integration.
