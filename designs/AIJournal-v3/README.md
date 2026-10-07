# AIJournal-v3

**Current product scope:** [V3-REVISION.md](V3-REVISION.md). It supersedes the
older guest, tier, offline and account assumptions in the historical handover.
The developer request is [RecommendedChanges.md](RecommendedChanges.md).

This is the primary workspace for all further Journal design and implementation adjustments.

**Receiving this folder on another computer?** Start with
[EXPORT-HANDOFF.md](EXPORT-HANDOFF.md). It covers standalone files, bundled fonts,
microphone permissions, browser differences, the optional local preview server
and cross-platform build/test instructions.

- Review: [mobile](journal-prototype.html), [tablet](journal-prototype-tablet.html), [desktop](journal-prototype-desktop.html).
- Open [journal-website.html](journal-website.html) directly in a browser to review the full-width website. It opens at sign in, has no review index or device frame, and switches between the mobile, tablet and desktop designs as the window changes width. Copy this one HTML file to another computer; it needs no server, assets or build tools. Text and voice added in the preview stay in browser memory until reload or close. Sign in is a design interaction, not a connected account.
- [Design system](design%20system/index.html). Historical specimens are archived outside this project; see [cleanup record](docs/CLEANUP-2026-10-07.md).
- The approved Writing companion is now in the main web design. Recent overview sits above writing; Today felt uses the journal's left-column divider, with Light, Good, Even, Low, Hard choices and green-to-red feedback. Journal gutter labels are left aligned. The original study is preserved in the cleanup archive. Canonical markup is in the numbered screens and `scripts/writing-companion.mjs`; after changing that helper run `node scripts/build.mjs`.
- Main sign-in and sign-up now use the approved plain-paper open spread, with opaque softly shaded forms, password confirmation, eye controls and inline validation. The numbered 13/14 web screens are their source of record; the diagonal-light glass file remains an exploration only.
- Voice recording now uses the approved Compact Transport in the main website and all three walkthroughs. Record opens the ready recorder with the browser's own permission prompt; Start is explicit. Pause mutes capture; Stop and keep returns directly to the journal. Live and saved waveforms use measured audio, with smooth playback and fixed timer space. Resizing keeps the active recorder intact and switches the journal layout after returning. The standalone studies are preserved in the cleanup archive.
- Recorder layout and motion are documented in [docs/recording/DESIGN.md](docs/recording/DESIGN.md). Its canonical helpers are `scripts/compact-recorder.mjs`, `scripts/journal-live-audio.js` and `scripts/journal-recorder-runtime.js`, alongside `lock.css` and `scripts/prototype-runtime.js`. After changing shared recorder markup, run `node scripts/build.mjs`.
- The 15–18 state packs now keep their page context: auth outcomes use the same plain-paper spread; save, upload, edit, delete and mood failures retain the relevant controls and draft. Account variants retain email, timezone and current-device details. Your data opens without a dialog; Delete everything opens its own confirmation. Complete Today and past-day states without model content are available in the walkthrough index.
- Latest prototype comparison: [RecommendedChanges review](verification/recommendedchanges-review.md).
- Written entries have edit/delete icons, and saved voice memos have only delete icons at the right edge of the bar on desktop, aligned with the first text line and fading in on hover. On mobile and narrow tablet layouts, text uses the full width and visible controls sit below it, with memory on the left and icons on the right. Keyboard focus reveals them immediately; touch keeps them visible. A memory-state disclosure opens a single Use in memory checkbox; Out of memory stays visible when selected. Memory controls are compact with a centered arrow. Edit icons fade green and delete icons fade red on hover without a background box. Preview edits, confirmed deletion and memory changes survive viewport changes until reload.
- [Motion index](motion-index.html) and [implementation contract](MOTION-HANDOVER.md).
- Read AGENTS.md, PROJECT.md, AUTH-HANDOVER.md and direction-lock.md before editing.

Build everything with `node scripts/build.mjs`; the build normalizes shared markup and regenerates state packs before exporting. Delivery packages use `scripts/package-handover.ps1` and exclude historical studies and QA screenshots by default. See [cleanup record](docs/CLEANUP-2026-10-07.md).

Edit numbered pages, lock.css, design system/index.source.html, and component sources. The 15–18 state packs are regenerated from scripts/apply-v3-states.mjs when their shared structure or copy changes; rerun that script before the builds below after editing it. Each platform's 00-prototype.html is assembled from the numbered pages by scripts/build-v3-prototypes.mjs, which runs through build-prototypes.mjs. The generated walkthroughs inline scripts/prototype-runtime.js so their composer and voice memo controls work in the browser. Entries and recordings added there disappear on reload or close; recordings can be downloaded. The numbered design comps remain script-free. Review motion intentionally plays when Windows animations are disabled; production without the review attribute respects reduced motion.

Run from this folder:

```powershell
node scripts/build.mjs
node scripts/verify-v3-runtime.mjs
node scripts/verify-compact-merge.mjs
node scripts/verify-compact-merge.mjs --firefox
node scripts/verify-website-preview.mjs
node scripts/verify-revision-states.mjs
node scripts/verify-portability.mjs
node scripts/verify-cleanup.mjs
node scripts/verify-writing-companion.mjs
node scripts/verify-writing-companion.mjs --firefox
```

Current browser checks detect an installed Edge, Chrome or Chromium, with `CHROMIUM_PATH` / `EDGE_PATH` overrides; the Firefox check supports `FIREFOX_PATH`. They use temporary profiles and fake microphone input where needed. Run `node scripts/verify-website-preview.mjs` for website interactions and `node scripts/verify-portability.mjs` for bundled fonts, standalone component tests and the optional local server. `node scripts/serve-preview.mjs` serves the website at `http://127.0.0.1:8000/` if local-file microphone or module restrictions apply. No server is required for the generated HTML previews. Current checks launch disposable browsers through `scripts/browser-harness.mjs`. Obsolete checks and the September motion-preservation comparison are preserved in the cleanup archive.

Earlier folders, obsolete exports and the pre-cleanup handover are in ../AIjournal-previous-projects-2026-09-30.zip, verified against SHA-256 hashes in its manifest. One-time migration scripts and superseded explorations are preserved in the cleanup archive, outside the active project. Only disposable handover browser profiles were excluded from the September snapshot.

Native scope remains Today only; the remaining native screens and dark mode are still deferred.
