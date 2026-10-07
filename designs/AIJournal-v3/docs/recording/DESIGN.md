---
name: Journal Compact Transport
description: Approved recording component in the main Journal website and portable walkthroughs.
colors:
  paper: "#F5EDE1"
  paper-2: "#FBF6EE"
  grid: "#E4D8C7"
  rule: "#6E4740"
  rule-2: "#8A6156"
  block: "#364434"
  block-2: "#B7BBA2"
  action-delete: "#A6372D"
typography:
  title:
    fontFamily: 'Constantia, "Journal Portable Prose", "Palatino Linotype", Palatino, "Iowan Old Style", "Hoefler Text", "Times New Roman", Georgia, serif'
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.16
    letterSpacing: "-.015em"
  timer:
    fontFamily: 'Constantia, "Journal Portable Prose", "Palatino Linotype", Palatino, "Iowan Old Style", "Hoefler Text", "Times New Roman", Georgia, serif'
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-.015em"
  label:
    fontFamily: '"Segoe UI", "Journal Portable Labels", system-ui, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: ".07em"
  guidance:
    fontFamily: '"Segoe UI", "Journal Portable Labels", system-ui, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  surface: "2px"
spacing:
  s4: "8px"
  s5: "10px"
  s6: "14px"
  s7: "20px"
  s8: "28px"
components:
  button-primary:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.surface}"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.block}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.rule}"
    typography: "{typography.label}"
    rounded: "{rounded.surface}"
    padding: "0 14px"
  button-retry:
    backgroundColor: "transparent"
    textColor: "{colors.rule}"
    typography: "{typography.label}"
    padding: "0"
  button-disabled:
    backgroundColor: "{colors.grid}"
    textColor: "{colors.rule}"
    rounded: "{rounded.surface}"
  recording-sheet:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.rule}"
    rounded: "{rounded.surface}"
  recording-field:
    backgroundColor: "{colors.block-2}"
    textColor: "{colors.block}"
    padding: "14px 28px"
  saved-memo:
    backgroundColor: "{colors.block-2}"
    textColor: "{colors.block}"
---

# Design System: Journal Compact Transport

## Overview

**Creative North Star: "An open journal"**

This component record captures the approved Compact Transport merged into the main Journal preview. Warm graph paper, the punched left binding, an opaque ruled sheet, rust printed guidance and green audio retain Journal's established direction. The recorder is sized by its content; time sits in its status header above a broad, shallow waveform and grouped controls.

Authority is confined to recording and measured saved-memo playback. [V3-REVISION.md](../../V3-REVISION.md), [direction-lock.md](../../direction-lock.md) and [AGENTS.md](../../AGENTS.md) retain the project contract. This document does not establish a whole-project design system. The approved Compact Transport study and its study record are preserved in the cleanup archive described in [CLEANUP-2026-10-07.md](../CLEANUP-2026-10-07.md); they are optional historical snapshots.

**Key Characteristics:**

- Content-sized recording sheet with status, date and time above the waveform.
- Native microphone permission followed by an explicit Start recording action.
- Real local capture, measured live levels and a static measured saved shape.
- Direct return to the saved memo, with stable playback time geometry.
- Flat paper, fine rules, compact corners and visible keyboard focus.

## Colors

The frontmatter records the values inherited from [lock.css](../../lock.css). Rust rule carries printed guidance, outlines and primary actions; secondary rust carries subdivisions and small labels on opaque paper. Green audio carries waveform, elapsed time, status and playback. The muted audio field distinguishes a recording through its fill, waveform, time and play control together. Warm paper, lighter sheet and decorative graph rule supply the grounds. Delete feedback red belongs to the saved row's delete icon.

**The Audio Rule.** Use the inherited green pair for audio and the existing green focus treatment. Keep printed guidance and recording actions in rust at rest.

Secondary rust text requires an opaque paper ground. Graph rule is decorative and never carries text or meaning. Permission-disabled Start uses the existing graph fill and border with rust text and a grayscale filter; it introduces no new color role.

## Typography

Constantia is the serif title and timer face; Segoe UI is the printed guidance and control face. The bundled Journal Portable Prose and Labels are Lora and Source Sans 3. The masthead date retains Journal's Ink Free / Journal Portable Hand role, with bundled Caveat fallback. The exported files embed fonts and licenses.

The title uses the recorded title role, becoming (29px) at the narrow recorder container. The recording clock remains (28px) with tabular numerals at every width. Status and controls use uppercase printed labels. Guidance uses the recorded guidance role, with compact helper and date text at the inherited quiet size (11px). The waveform axis uses the small key role (10px). Saved playback labels use stacked, tabular printed numerals (11px, line-height 1.5).

**The Reserved Time Rule.** Keep saved elapsed and total labels in a stacked column with a minimum width of (8ch); increase its width for longer memo labels. Starting playback must not change waveform width.

## Layout

The recording page uses the existing binding rail (24px) at the left edge in mobile, tablet and desktop profiles. Its graph module remains (14px). This recorder page does not inherit the desktop Today sidebar composition. Page padding is `clamp(20px,3vw,56px)` vertically at the top and `clamp(14px,3vw,56px)` horizontally, with a bottom inset of (28px). The masthead and recorder top gaps are (28px), with (20px) between the back row, intro and sheet.

The sheet has three bands: status/date/time, uninterrupted waveform field, then controls and helper text. The header uses `minmax(0,1fr) auto auto`, aligned centrally with (20px) gaps and (14px 28px) padding. Time is right aligned above its caption. The waveform remains (80px) high. Controls and helper text share a wrapping row, with the control group at the left and guidance at the right. Panel height follows this content; there is no recorder-panel viewport minimum height.

At a recorder container width of (620px) or less, page padding becomes (20px 14px 28px). Status and date stack on the left while time spans both rows on the right. Header padding becomes (12px 14px); waveform and controls use (14px). Controls precede helper text and the primary control fills remaining row width. At (336px) or less, masthead and back text wrap and each action can occupy a full row.

Saved memo bands retain the dated row's time column (58px). Their audio region uses `44px minmax(0,1fr) auto`, with a play target, waveform and reserved timer, (14px) gaps and horizontal padding. At viewport widths of (620px) or less, those gaps and padding reduce to (8px). Entry tools follow the existing responsive row treatment: at container widths up to (1000px), visible memory controls sit left and deletion right beneath the content; desktop reveals the right-edge icon on hover or focus.

The website chooses mobile, tablet and desktop profiles at app content widths of (700px) and (1200px), measured after its binding inset. A profile replacement waits while the recorder is Ready, recording, paused or saving. The existing container layout still responds to width during that interval. Once the recorder becomes idle, the website snapshots and restores preview content into the requested profile.

## Elevation & Depth

The recorder and saved audio row use no shadows. Opaque sheet fills, fine ruled edges, visible graph around the sheet and the muted green audio band establish depth. The auth spread's shadow exception does not belong to this component.

## Shapes

Sheet and control corners use the inherited compact radius. Divisions and outlines are fine (1px) rules. Binding holes and the small status dot remain circular. Recorder icons use outlined SVGs (20px), round stroke caps and joins, and a stroke width of (1.5). Saved play targets are (44px) square. The waveform uses (128 bars) in a (1024 × 180) SVG viewBox, (4-unit) widths and (8-unit) spacing.

## Components

### Controls and permission states

Start recording and Stop and keep use the rust filled primary button; Cancel and Pause / Resume use the opaque paper keyline button. Try again is a dotted-underlined quiet action. Targets are at least (44px) high. Keyboard focus uses the inherited green outline (2px) with offset (2px); pressed buttons move down (1px). Icons are decorative and button text carries the action.

Every opening begins Ready at 0:00 with a near-flat still waveform and no memo. Opening the page requests access through the native browser prompt. Granted permission prepares a muted stream; only Start recording enables the tracks and starts AudioContext, AnalyserNode and MediaRecorder. The microphone is not connected to the speakers.

Start stays disabled while permission is pending, denied, missing or unavailable. Inline live-status text explains the native request or failure and describes Start through `aria-describedby`. Denied access says “Microphone access is blocked” with browser-settings guidance. Recovery offers Try again when access is denied, missing or unavailable. Cancel or Today before starting releases the stream, invalidates pending permission results and returns without a memo; late-arriving streams are stopped.

### Live waveform and capture

The live display measures (2048 time-domain samples) every (40ms), removes their mean and computes RMS. A quiet floor (0.002), square-root gain (2), clamp to (1), attack (0.65) and release (0.2) produce a speech-volume envelope. The last (128 levels), about (5.12 seconds), drive centered bar scale with a minimum amplitude of (0.015). There is no generated waveform loop.

Pause freezes elapsed time and live drawing, pauses the encoder and disables the audio tracks. Resume continues the same memo. Elapsed time updates every (100ms) during capture. Hidden pages, non-rendered SVGs and production reduced-motion conditions suppress live visual writes while recording continues; browser background timers can be throttled.

Stop and keep mutes input while the encoder flushes, releases audio resources, retains the audio Blob and condenses measured history into (128 peak bins). It returns directly to the originating Today page and focuses the new memo. Leaving through Today while recording or paused also keeps the memo. Failure to keep returns to Ready with inline recovery text. Page close releases resources.

### Saved waveform and playback

The measured shape is saved as centered rectangles: `height = 160 × max(0.015, level)` and `y = 90 − height/2`. Two SVG use layers reference that one static shape. Actual Audio playback advances a clipped highlight through `scaleX`, driven by `Audio.currentTime` on requestAnimationFrame. The waveform geometry never animates or regenerates during playback; there are no repeated per-bar opacity updates.

Progress uses finite actual media duration when available, with unrounded capture duration as fallback. Rounded labels are presentation only. A linear transform transition (60ms) interpolates coarse browser time updates. Base and played-layer opacity settle over (180ms), using `cubic-bezier(.16,1,.3,1)`; the base moves from full opacity to (0.4) while playing.

Manual Stop reads the rendered clip matrix and removes interpolation to freeze the visible partial position. Natural completion advances the clip to (1), lets its last transition finish and retains the complete measured waveform and final time. Only an explicit replay resets progress: disable transition, commit zero, then restore interpolation. Hidden-page frames stop and visibility restores them; non-rendered rows are skipped.

The current main controls are named Play voice memo and Stop voice memo playback. A live saved memo has memory controls and delete only; it is not editable. Deletion asks for a second confirmation in the row, removes the memo from preview views and revokes its temporary Blob URL. Memory defaults to included and uses the existing In memory / Out of memory disclosure with one Use in memory checkbox.

### Review and portability

[journal-website.html](../../journal-website.html) and the three portable walkthroughs bundle the real capture and playback runtime. Audio and added content remain in browser memory until deletion, reload or close; there is no upload or account persistence in this layer. Native permission availability depends on the browser's local-file policy; the existing localhost preview is available when needed.

Review output preserves `data-motion-review="play"` on html for the user's disabled Windows animation setting. Product integration without that attribute respects reduced motion: live visual updates stop, playback interpolation and layer opacity transitions disappear, and status/time remain readable. Capture and audio playback continue. This is a review exception, not a production preference override.

Implementation sources are [compact-recorder.mjs](../../scripts/compact-recorder.mjs), [journal-recorder-runtime.js](../../scripts/journal-recorder-runtime.js), [journal-live-audio.js](../../scripts/journal-live-audio.js), [prototype-runtime.js](../../scripts/prototype-runtime.js), [build-website-preview.mjs](../../scripts/build-website-preview.mjs) and [lock.css](../../lock.css). Generated HTML is rebuilt from these sources. The integrated main-website review passed (27 checks) in Edge and (27 checks) in Firefox at this documentation snapshot.

## Do's and Don'ts

### Do:

- **Do** keep every opening Ready until native access is granted and Start recording is pressed.
- **Do** retain the compact status/time header, shallow uninterrupted waveform and content-sized sheet.
- **Do** drive live bars from microphone RMS and retain one static measured shape for saved playback.
- **Do** keep the stacked timer width stable through playback, manual stop, completion and replay.
- **Do** preserve direct keeping into Today, focused return, resource cleanup and temporary preview data across profile changes.
- **Do** preserve inherited color roles, binding, graph, opaque paper, compact corners and visible focus.

### Don't:

- **Don't** use a simulated waveform or auto-start capture when native permission is granted.
- **Don't** animate the saved bar geometry or reset partial progress when playback stops.
- **Don't** replace the active recording profile during Ready, capture, pause or saving.
- **Don't** import other recording explorations' layouts or permission flow into the approved main component.
- **Don't** imply uploaded or persisted recordings in the browser preview.
- **Don't** carry the explicit review override into the production reduced-motion policy.
