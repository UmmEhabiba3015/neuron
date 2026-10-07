# Journal v3 · current product and design contract

This document records the October 2026 revision requested in `RecommendedChanges.md`.
It supersedes older feature, tier, guest, offline, account and route decisions in
`ai-journal-brief-v2.md`, `00-flow.md`, `PROJECT.md`, `AUTH-HANDOVER.md` and
`direction-lock.md`. The locked visual system, thirty-seven-component inventory,
accessibility floor and measured C3 motion rules remain binding. Numbered screens
are the design of record. The three `00-prototype.html` walkthroughs and share
builds are generated from them.

## Product scope

- An account is required. There is no guest journal, guest transfer, separate
  device-restore page or signup email-verification step. Logged-out account
  screens have no app destinations; opening a protected route sends the person
  to sign in.
- Sign in and registration use email and a password of at least eight characters.
  Registration also asks for a matching confirmation password. The approved
  plain-paper open spread is used for sign in and registration at all web sizes:
  contextual copy on the facing page, an opaque form with soft shadows, and the
  punched rail at the left edge. This is the user-approved auth-only exception
  to the flat sheet treatment. Recovery and password-hint text use an 8px gap;
  password-length errors replace the hint rather than appearing beside it.
  Registration signs the person in and opens Empty Today. A password reset uses
  a single-use link good for 30 minutes, signs out every device, and returns to
  sign in with a one-time confirmation. Request and sign-in error copy never
  reveals whether an address has an account; registration may say that an
  address is already registered. `reset-email.txt` is the plain-text email.
- The web app needs a connection. Save, upload and fetch failures are shown in
  place. Draft writing survives save failures and session expiry. An unsent
  recording remains on the current page for retry and is lost if that page is
  closed; the screen says so plainly.
- There are no Free and Pro tiers. Typed entries, recordings, mood, Timeline,
  search, exclusion from memory, export, transcription, notes, conversations,
  answers and reflections belong to everyone. Model-dependent capabilities may
  arrive later in the build; a whole day with no note and an audio row with no
  transcript are normal full-product states.
- Import, trackers beyond mood, notifications, Timeline totals, the crisis
  card, the plan page, the upgrade screen and offline product states are removed.
  The persistent crisis resource in settings and composer overflow remains.
  Native work is paused after the existing Today specimen.

## Routes and states

| Route or area | Design of record | Key rule |
|---|---|---|
| `/in`, `/new` | `13-login.html`, `14-register.html`, `15-auth-states.html` | Account first. One sign-in error for wrong email or password. No verification step. |
| `/forgot`, `/reset` | `15-auth-states.html`, `reset-email.txt` | Uniform request confirmation, 30-minute one-use link, no automatic sign-in. |
| `/` and `/today` | `01-today.html`, Empty Today in `11-states.html` | Blank or whitespace-only composer stays in record mode. Save failure preserves text. |
| `/timeline`, `/day` | `02-timeline.html`, `06-conversation.html`, `18-entry-system-states.html` | No total. An empty day is not a route. A deleted last item removes its Timeline row and offers Back to Timeline. |
| `/talk`, `/ask` | `03-talk.html`, `04-ask.html`, `16-flow-states.html` | Audio is kept as audio before transcription. Search excludes recordings without text. |
| `/you`, `/you/data`, `/you/account` | `07-you.html`, `10-settings-privacy.html`, `17-account-data.html` | Four top-level rows: model visibility, privacy, data, account. |
| Entry and recording actions | `18-entry-system-states.html` | Written entries have first-line-aligned edit/delete icons; voice memos have delete only. Both reveal actions on hover/focus and use a compact memory-state disclosure. |

`15-auth-states.html` includes validation, request, rate-limit, connection and
arrival states. `16-flow-states.html` retains microphone, recording and search
states that still apply. `17-account-data.html` covers devices, timezone, export
and account deletion. `18-entry-system-states.html` covers entry options,
editing, item deletion, loading, errors and a day without a note or transcript.
Every file exists at 390, 834 and 1440 widths.

### October prototype state review

- Auth outcomes reuse the approved plain-paper spread. Signup variants retain
  Confirm password, eye controls and one password-length hint or error.
- Your data is unobstructed at rest. `account-delete-confirm` opens its single
  blocking dialog; `account-delete-failed` keeps the same page behind it.
  Export instead remains the filled safe action. Keep my account returns to data.
- `today-without-note` and `day-without-note` show complete days with typed
  entries, saved audio, memory controls and mood, without glance, notes, model
  questions or transcripts. Today keeps the composer; the past day has none.
- Save failures retain the composer draft and Save. Upload failures retain the
  audio row, play control, retry and explicit loss-on-close warning. Mood failures
  show the saved choice. Edit and delete failures remain in the affected row.
- Loading variants retain their actual page shell, title/date and destination
  selection or past-day back link. Earlier loading and the end of Timeline remain
  at the foot of the existing list. Fetch failures exist for Today and a past day.
- Account's single-device, removed-device and failed-device variants retain email,
  timezone, current-device dates, sign-out and password-reset guidance. Removing
  another device adds no success message; failure retains that device and explains
  that it is still signed in.

This review concerns the prototype's screens and states. Fictional account data,
simulated downloads and separate mock outcomes are deliberate review fixtures.
See `verification/recommendedchanges-review.md` for the completed comparison.

## Decisions resolved for this revision

| Open design point | Decision |
|---|---|
| Password visibility | All three password forms offer the same Show password control. Production toggles the single field's type without clearing its value. The static comp shows the control only. |
| Return after three silent weeks | Use the person's last entry as a verbatim echo. No generated greeting is required. |
| Item actions | Written entries show edit/delete icons and saved voice memos show delete only at the right edge of their bar, aligned with the first text line, fading in on hover and appearing immediately for keyboard focus. Touch retains visible controls. A labeled In memory / Out of memory disclosure opens a compact, single-row Use in memory checkbox. The excluded state stays visible at rest. All targets are at least 44 pixels. Edit opens in place; delete needs a second in-place confirmation. Voice memos cannot be edited. Icon hover feedback fades edit to green and delete to red, without a background box. Memory labels, checkbox and panel are compact, and the arrow is vertically centered with the label. At container widths up to 1000px, text uses the full width, with visible memory controls on the left and action icons on the right in a compact row below. Desktop retains first-line hover controls. |
| Entry editing | The existing ruled row holds the editable text. Save or leave as it was; a failed save retains the changed words. Editing keeps the original time and adds no edited marker. |
| Support resource | The composer option row has More options, which opens the existing option treatment and the support route. Privacy settings link to the same resource. It is always available and never triggered by attempted distress detection. |
| Item deletion | The item leaves every product view at once and cannot be restored there. It remains hidden in storage until account deletion. No toast or undo. |
| Last item of a day | The day route says there is nothing on that day and links to Timeline, where its row has gone. |
| Export completion | A quiet Ready state provides the file again if automatic download did not start. Empty accounts explain there is nothing to export; the action remains available. |
| Timezone choice | The existing Field component wraps a native select with the full supported timezone list. The Account row shows the current city and UTC offset in words. A day ends at 4am in the selected timezone. Past entries keep their original days. |
| Loading shell | Keep the masthead and destinations visible; put one plain line in the content position. No spinner, skeleton, toast, disabled action or extra color role. |
| Missing content | An unknown day or entry and one belonging to another person use the same not-found screen. A day with no content also has no route. |

The only blocking dialog remains account deletion. Its safe action is Export
instead. On success the person is signed out everywhere and arrives at sign
in with a one-time deletion confirmation. Device-row sign-out requires no
dialog. The current-device and everywhere actions both return to sign in.

## Build and review

On Today, **Today felt** stays after all written entries and voice memos,
before the composer. Newly added items are inserted into the existing journal
sheet above the mood row in chronological order, with the newest item last.
This placement survives edits, deletion and responsive profile changes.
Today opens at the newest end, like a chat. Saving text or keeping a voice memo
scrolls to the bottom; scroll up to read older entries. Resizing keeps the bottom
in view when already there, or preserves the entry being read when scrolled up.
Editing and memory changes do not pull the reader back to the newest entry.
The full mobile/tablet header stays in place while scrolling: masthead, date or
page control, and destinations remain together. Pushed pages retain their Back
header. Desktop keeps its binding-column navigation pinned in place. Headers
have an opaque paper background; very short viewports can scroll the header or
sidebar independently so every control remains reachable.

### Approved Writing companion integration, 7 October 2026

Recent overview moves from above the journal into the writing footer, above the
input. Its original wording remains intact and is visible while reading older
entries. The footer stays fully visible instead of using the C3 scroll tuck;
very short windows can scroll within it. Its height limit reserves the measured
mobile/tablet header plus at least one 44px slice of the reading area. Other
composer states retain their previous motion where there is no overview.

Today felt shares the journal's 58px label column and 1px divider. Times, dates,
record-note labels and mood labels are left aligned; minimum intrinsic text
width cannot push a divider outward. Past-day mood uses Day felt. Choices run
Light, Good, Even, Low, Hard, with green, olive, amber, rust and red feedback.
Hover fades text and a pale paper tint in 160ms and out in 120ms. Touch selection
retains its tint and underline; focus/press feedback is immediate. Mood choices
survive responsive profile changes in preview memory. Labels and underlining
carry meaning independently of color, and targets remain at least 44px.

These are approved additions to the earlier palette and motion inventory.
Without the review playback attribute, reduced motion removes the fades.
Days without model output show no empty overview heading. Related error states
retain the compact mood layout and saved choice. Source markup is applied by
`scripts/writing-companion.mjs`; the state and prototype builders also use it.

### Approved Compact Transport integration, 7 October 2026

The main recorder now uses the approved `05-compact-transport.html` study. Record
opens `/talk` directly, requests native browser microphone permission and remains
at 0:00 until Start recording. The prepared stream stays muted until Start.
Denied, missing or unavailable microphones disable Start and show an inline
status with Try again; there is no separate application permission page.
This disabled Start is an explicitly approved exception to the historical
no-disabled-controls convention.

Pause stops the encoder, mutes the input and freezes elapsed time and the measured
waveform. Resume continues the same memo. Stop and keep, or leaving a recording,
flushes the local audio and returns to the originating journal page without a
memo-preview step. Cancel before Start releases the input without adding a memo.
Legacy permission routes open the same recorder; kept/transcribing comps remain
review specimens, outside the normal capture flow.

The live waveform uses microphone amplitude samples, not a decorative loop.
Saved memos retain 128 measured peak bins. Playback reveals that fixed geometry
smoothly, reserves timer width before playing and retains the complete waveform
at the end. Recorded blobs and measured waveforms survive responsive profile
changes in browser memory. During an active recorder the common responsive shell
adjusts in place; the journal profile changes after returning.

Numbered recording and recovery comps remain script-free. The generated website
and walkthroughs inline the main audio/controller helpers. The standalone studies
retain their own copies so future main edits do not alter the explorations.

The numbered HTML files are static design comps. Generated walkthroughs add a
browser-only review layer for typing, temporary entries, microphone recording,
pause, playback and recording download. New content stays in memory until the
page is reloaded or closed; it is not stored in an account or sent to a server.
The password toggle,
recording upload retry, account export, timezone save, deletion and session
restore behavior are integration obligations. Do not infer working storage or
server behavior from prototype hash links. Forms contain fictional data only.

Run `node scripts/build-prototypes.mjs` to assemble each platform's
`00-prototype.html` from the numbered screens and inline `lock.css` into the
three portable walkthroughs. Run `node scripts/build-motion.mjs` and
`node "design system/build-export.mjs"` for the motion index and guide.
The 15–18 state packs are generated by `node scripts/apply-v3-states.mjs`;
rerun it before the builds when changing their shared state definitions.
Review motion remains enabled by `data-motion-review="play"`; production
without that attribute respects reduced motion.
