# Journal runtime components

This directory turns the handover's semantic HTML into application components without
choosing a framework. `lock.css` still owns every visual decision; this package adds only
state, events, focus management and lifecycle cleanup.

The bundle embeds portable fallback fonts and their license text. The generated
`tests/runtime.html` is self-contained and can be opened directly; it should say
**Passed**. Edit `tests/runtime.source.html` and rebuild with
`node "design system/build-export.mjs"` from the project root. To test module
source files, run `node scripts/serve-preview.mjs` and open them through the
printed local address. See `../../EXPORT-HANDOFF.md` for the full transfer guide.

## Use

For another application, load the bundled stylesheet and the runtime adapter. The stylesheet
contains the complete visual system, so it does not depend on the handover's folder layout:

```html
<link rel="stylesheet" href="/journal/components/journal-components.bundle.css">
<script type="module">
  import { mountJournalComponents } from "/journal/components/journal-components.js";

  const journal = mountJournalComponents(document, {
    composer: {
      onSave: async ({ value, excluded }) => api.entries.create({ value, excluded }),
      onRecord: () => router.push("/talk")
    }
  });

  // Call when the containing app or route unmounts.
  // journal.destroy();
</script>
```

Wrap the Journal surface so its component styles cannot affect the host application:

```html
<div class="journal-app">
  <div class="app">...</div>
</div>
```

Every controller also has a named export for framework lifecycle hooks. Mount
`createComposer(element, options)` in a React `useEffect`, a Vue `onMounted`, or a Svelte
action, and call `destroy()` during cleanup.

## Ownership boundary

Motion: `.app` owns the C3 variables; keep that ancestor inside `.journal-app`. Reuse the CSS
bundle and preserve `.gline` for product-authored lines and `.lblbox` inside note summaries.
The application must preserve screen instances on Back and same-screen changes; this adapter
cannot prevent animation replay caused by a router remount. See `../../MOTION-HANDOVER.md`
for full timings, accessibility, capability policy and the resolved scroll-fill issue.
The guide's replay controller is not part of the runtime.

- The application owns persistence, API errors, authentication, audio URLs and routing.
- The runtime owns pressed state, keyboard behavior, busy protection, live announcements,
  focus return and event-listener cleanup.
- Same-screen changes do not navigate, so they do not replay arrival motion.
- Timeline date selection scrolls directly and never pushes a browser history entry.
- Back controls delegate to the application router so the existing screen instance survives.

## Declarative hooks

`mountJournalComponents` recognizes `composer`, `mood`, `timeline-view`, and `calendar` in
`data-journal-component`. Audio, app navigation, back controls and the destructive dialog
need application-owned dependencies, so initialize their named exports explicitly.

`journal-components.css` contains only runtime additions for development inside this
handover. Exporting it alone is intentionally unsupported; use
`journal-components.bundle.css` outside this folder. The bundle removes prototype-only
browser furniture and scopes every visual rule under `.journal-app`.
