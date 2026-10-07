# Journal motion handover: C3 glide

## October Writing companion integration

The approved Writing companion is now the main web Today layout. Its overview
is inside the writing footer, so `.composer.writing-companion` remains fully
visible instead of running C3 arrival/scroll tuck. The overview is immediately
readable rather than retyping on load. Other C3 objects retain their contracts.
The footer can scroll internally on short viewports and reserves the measured
full mobile/tablet header plus 44px of reading space.

The compact ruled mood row fades text color and a pale paper tint in 160ms and
out in 120ms, reusing the approved entry-feedback rhythm. Press/focus feedback
is immediate; touch selection retains the chosen tint. No position or scale
changes. Production reduced motion disables both transitions; review keeps the
user-requested override. Evidence: `verification/overview-studies/*-main-checks.json`.

## October entry action fade

The user requested hover-revealed entry controls. Written-entry and saved voice-memo icons now fade
from opacity 0 to 1 over 160ms and back over 120ms, with ease-out CSS transitions.
Only opacity changes; space for the controls is reserved so text remains
stationary. At container widths up to 1000px, paragraphs use full width and controls sit
below them in a visible row (memory left, icons right). The first-line hover
reveal applies to wider desktop layouts. At 60Hz this gives about ten entrance frames and seven exit frames.
This is an approved addition to the earlier four-object motion inventory.
Written entries offer edit/delete; voice memos offer delete only. Hover feedback
fades the edit icon green and the delete icon red over 160ms, returning over
120ms, without a background box. Keyboard focus provides immediate color
feedback. Production reduced motion disables these color transitions too.

The fade applies to hover-capable fine pointers. Keyboard focus reveals the
controls immediately, touch keeps them visible, and an open memory panel keeps
the entry controls available. Production respects reduced motion with immediate
state changes. Review files retain the requested playback override even when
Windows animation effects are disabled. Edge measurement evidence is in
`verification/website-preview-checks.json` under entryMotion.
Firefox evidence is in `verification/entry-motion-firefox.json`; both engines
passed written-entry and voice-memo fade-in/fade-out, stationary text and
reduced-motion checks. Voice controls align with the first transcript/label line.

> **Current scope:** [V3-REVISION.md](V3-REVISION.md) supersedes the older guest, tier, offline, account and route decisions below. Historical reasoning and the locked visual, accessibility and motion rules remain useful.


## Review playback override, explicitly requested

Windows `SPI_GETCLIENTAREAANIMATION` returned false and the browser reported
`prefers-reduced-motion: reduce`, which was suppressing motion. All handover screen sources,
full walkthroughs and the design-system guide now carry `data-motion-review="play"` on `html`.
This enables their existing animations regardless of the system preference, without changing
Windows settings. Guide replay uses the same effective preference. Remove this review attribute
when integrating into a production app; unmarked surfaces still respect reduced motion.

This user-requested review exception supersedes earlier no-bypass instructions for these
handover files. It changes neither timings nor screen content. Verification is recorded in
`verification/review-motion-bypass.json`, including changing rendered effect values under
reduced motion and the normal reduced-motion behavior after removing the attribute.

Completed from the approved AIJournal-v2 C3 work and the revision 49 merge, September 2026. The brief, flow and direction lock retain their authority. This document makes the motion implementation and review path explicit; it introduces no new animation language.

## Open and review

- [Motion index](motion-index.html): all 48 current numbered web screens, three walkthroughs and the existing native Today screen.
- [Interactive design system](design%20system/index.html#motion): actual Today markup, replay, note disclosure, composer scroll/focus, tokens and choreography. The specimen field is editable only to review focus; it does not save or record.
- [Full mobile motion handover](journal-prototype.html): the complete current mobile walkthrough, including all 91 states. Tablet and desktop are `journal-prototype-tablet.html` and `journal-prototype-desktop.html`. This file is no longer an isolated Today specimen.

All review files now play motion even when the system requests reduction, by the explicit
review override above. `#motion` in the guide only navigates to its section; the root attribute
controls playback. The production behavior without that attribute still removes motion.

## What was missing and which source wins

The integration source is all 39 implemented files in the three AIJournal-v2 `_motion` folders, not the early phone preview. A browser comparison confirmed that all 36 original numbered handover screens already match the source load selectors, timing and curves. The current handover was retained and extended in place: account/flow markup now carries the existing product-line gesture, same-screen fixtures suppress repeat arrivals, and composer tuck persists after its scroll range. No v2 page replaced a current handover page.

AIJournal-v2 `mobile-web/_motion`, `tablet-web/_motion`, `desktop-web/_motion` and `motion-index.html` document the approved C3 work. Their pre-merge status, preference overrides and old account flows are historical. **Do not copy them over the current handover.** The v2 `journal-motion-preview.html` contains the superseded A5 experiment, explicitly identified as stale in v2 `HANDOFF.md`; the current mobile export is generated from the complete 91-state walkthrough instead.

Canonical implementation: `lock.css` sections 3.9–3.13 and desktop section 5; rationale: `direction-lock.md` sections 7.4, 7.7 and 15.12 onward. Supplemental specimens are preserved in the cleanup archive; earlier standalone systems are in the historical backup. The active guide is `design system/index.html`.

## Tokens, selectors and timing

Tokens are defined on `.app`, not `:root`. Keep a real `.app` ancestor in component specimens and application surfaces. Import the existing stylesheet or generated component bundle; do not duplicate the keyframes or substitute library defaults.

| Value | Contract |
|---|---|
| `--gc: cubic-bezier(.42,0,.58,1)` | Symmetric, no overshoot, approximately 1.724× peak speed. |
| `--gc-rise: cubic-bezier(.25,.46,.45,.94)` | Composer entrance and focus recovery. Scroll scrubbing itself is linear. |
| `--g-date: 500ms` | `g-write` on `.keybox .v:not(.printed)`. Widest date 225.2px; original measured pitch 13.15px gives a 492.2ms minimum at one character/frame, rounded to 500ms. |
| `--g-type: 820ms` | `g-draw`, `steps(48,start)` on `.glance .gline` and `.total .gline`. Longest line 48 characters, 17.08ms per step. |
| `--g-wave: 360ms` | `g-draw` on `.wave`, delayed by `--g-step: 110ms`. |
| Desktop wave: `520ms` | Descendant `.app .wave` override inside the 1200px container query. The token stays 360ms: a container cannot query itself. |
| `--g-comp: 240ms`, `--g-hide: 64px` | `g-lift` on `.composer:has(.opt)`. 64px hides exactly the out-of-memory option. |
| `--g-note: 420ms`, `--g-note-lift: 20px` | Note content lift, label roll and supported height growth share one clock in both directions. |
| `--g-roll` | Registered number 0 → -1 on `.lblbox`; both labels derive their positions from one value, one label height apart. |
| `--g-tuckable` | Registered number 1 → 0 on composer focus; multiplies the scroll tuck distance. Blur returns to 1. |

The 60Hz reference frame is 16.667ms. Date duration follows `D >= 1.724 × width × 16.667 / character pitch`; wave duration follows `D >= 1.724 × width × 16.667 / 45`. The widest desktop wave is 788.3px, requiring at least 503.4ms, hence 520ms. Composer timing also has a subpixel ceiling: 240ms is the slowest approved 64px rise without creeping. Re-measure geometry and legibility before changing text, fonts, distances or timing; these are not arbitrary presets.

| Today phase | Start | Finish |
|---|---:|---:|
| Composer rises | 0ms | 240ms |
| Date writes | 0ms | 500ms |
| Wave draws | 110ms | 470ms mobile/tablet; 630ms desktop |
| Product line types | 500ms | 1320ms |

The line waits only when its `.app` contains a handwritten date. Mobile/tablet Timeline has no such date: its total types from 0 to 820ms. Load animations use `backwards`, so the final state belongs to normal CSS. The record, wordmark, navigation and printed values are visible from first paint. Ask's restated user question has no `.gline` and never types. Privacy settings has no load motion. Account and flow pages reuse the printed-line gesture on the first introductory sentence; their fields and printed mastheads remain still.

## Interaction contract

**Composer:** it rises on initial app opening, tucks as the reader advances through the journal, reverses as they scroll back, and rises when interacted with while tucked. The scroll range is 24–120px, uses `scroll()` with linear progress, and has no independent time duration. Focus while already open produces no movement. Keep the scroll animation running and transition `--g-tuckable`; removing the animation does not produce the required return transition. The out-of-memory option exists on both tiers. A composer without `.opt` must not rise or tuck.

**Note:** native `details` starts closed. Keep `.lblbox` with `.lbl.shut` and `.lbl.open` inside `summary`, plus the chevron. Content lifts 20px fully opaque; labels roll together over 420ms and reverse on close. Preserve the citation and correction action. Supported `interpolate-size` height growth is progressive enhancement; where absent the height steps open with content intact. Do not introduce a fixed height or revive rejected grid-height fallbacks.

**Controls:** current C3 CSS uses `scale(.97)` while active, 160ms press and 280ms release with `--gc`. Hover colour changes immediately; focus remains visible. This supersedes the historical 1px translate description in section 7.5. The note chevron uses 420ms. Under reduced motion the pressed state remains instant, with no animated transition.

**Never move:** user entries, transcripts, restated questions, the masthead, crisis content or progress bars. No breathing microphone, ambient loops, spinners, generic page transitions or spring overshoot. The note disclosure and press feedback are interaction states, not additional load patterns.

## Application lifecycle and accessibility

1. Mount arrival motion only for a genuinely new arrival. Back restores the existing screen and scroll position, without replaying any of the four effects.
2. Typing, Save, validation, audio state and other changes within a screen preserve its instance. None restarts the date, line, wave or composer. Static prototype `.restate` now suppresses the date, product line and wave as well as the composer entrance. It retains scroll interaction, but cannot replace application route lifecycle logic.
3. Keep input values and drafts across transitions; give the actual composer input a persistent accessible name. Never autofocus it on arrival.
4. Timeline index scrolling does not push browser history. Focus and task completion never wait for a sequence to finish.
5. Preserve `.gline` and `.lblbox`. Waveforms are decorative (`aria-hidden`); the play control announces recording duration in words.
6. Under reduction remove all motion, including scroll tuck, note travel and transitions. Do not replace it with a fade, shorten it, or override the preference. Full content and instant press feedback remain.
7. Do not ship the guide's replay handler, review viewport, prototype `.restate`, duplicated saved screen or comp-only `.app { overflow:clip }` as routing behavior. The product viewport owns clipping.

The runtime adapter handles component events; it does not own application navigation or decide when a route is a fresh arrival. That remains the application's responsibility.

## Capability policy and acceptance

The original measured matrix enabled scroll tuck and interpolated note height in Chromium, and used a complete untucked composer and stepped note height in Gecko. Use the existing feature queries, not user-agent detection. Browser capabilities can change; absence of either feature requires no polyfill. WebKit and real touch hardware need validation by the implementing team; no native parity is implied by the web specimens.

Check mobile 390px, tablet 834px and desktop 1440px app containers in Chromium and Gecko, with motion enabled and reduced:

- Record date 500ms, type 820ms, correct conditional delay, waveform 360/520ms plus 110ms, composer 240ms. Check the record and header are stationary at first paint and mid-sequence.
- Scroll past 120px and back below 24px; focus and blur the real composer while tucked; focus at the top must not twitch. Where scroll timelines are unsupported it remains complete and open.
- Open/close the note rapidly and with keyboard; confirm labels remain one height apart, content remains visible when open, focus survives, and both directions settle. Repeat at 200% type.
- Exercise Back, typing and Save in the application without replay. Static walkthroughs cannot prove these obligations.
- With reduction enabled confirm zero load/scroll motion and no note transitions, including after replay or preference changes. The review control must never force motion on.
- Do not use `getAnimations()` alone to conclude that `::details-content` does not move; the original Chromium probe could not enumerate it. Inspect rendered frames for height and scroll motion.

## Regeneration

### Integrated fixes and new-page rules

The scroll rule now uses `animation-fill-mode: backwards,forwards`: the second animation stays tucked after 120px without applying before 24px. Focus still scales its distance to zero. The reduced-motion rule explicitly covers `.app.restate` so its higher specificity cannot keep scroll motion running.

New account/flow pages reuse `g-draw` on the first sentence of introductory `.auth-copy`, inside a `.gline[data-motion-copy]` span. The authored character count is `--g-copy-count`; duration is `820ms × count / 48` with that many steps, preserving the v2 17.083ms character interval. It consumes the existing product-line primitive rather than introducing a new entrance. Error/permission/offline guidance, notices, form fields and printed mastheads remain immediate. Pages with no eligible introduction still use the inherited control feedback. User-entered values are never wrapped.

All three current walkthroughs retain 91 states, 35 signed-in views with progress, and their existing routes/forms. The mechanical migration checks recover the original markup byte-for-byte when the inserted motion spans are removed. See `verification/motion-integration-changes.json` for the per-state coverage and `verification/integrated-motion-checks.json` for 546 state/preference checks.

### Build commands

Run from this folder:

```powershell
node scripts/build-prototypes.mjs
node scripts/build-motion.mjs
node "design system/build-export.mjs"
```

First run `node scripts/build-prototypes.mjs` after any stylesheet or walkthrough edit. The motion command rebuilds the index and guide specimen from current handover sources. The second rebuilds the self-contained guide and scoped component CSS. Edit `design system/index.source.html` for guide prose and `lock.css` only for approved product changes. Use the live AIjournal folder or AIjournal-delivery.zip. Previous projects and stale exports are preserved in the dated historical backup.
