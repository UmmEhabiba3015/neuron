# Opening Journal on another computer

## Start here

Extract the folder if it arrived as a ZIP. Open **journal-website.html** in a
browser. It is the responsive website preview, opens at Log in, and has no
review index or device frame. It needs no installation, server or internet.

For a guided screen review, open one of the three **journal-prototype*.html**
files. Those files are also standalone. The numbered files are static design
comps; text entry and recording run in the generated website and walkthroughs.

| Deliverable | What to send or keep |
|---|---|
| Responsive website | `journal-website.html` alone |
| Mobile/tablet/desktop walkthrough | The corresponding `journal-prototype*.html` alone |
| Design-system guide | `design system/index.html` works alone for viewing. Keep the folder for linked examples and editable sources. |
| Component interaction test | `design system/components/tests/runtime.html` now works alone. It should say **Passed**. |
| Numbered comps, motion index and source files | Keep the entire folder structure, including `lock.css`, `scripts`, `assets` and `design system`. |
| Retained auth explorations | Each HTML in `auth-alternatives/inset-backgrounds` is standalone; these are explorations, not the main design. |

## What was improved for transfer

- Portable exports embed styles, icons, scripts, fallback fonts and font licenses.
  There is no CDN, remote font request or dependency on the original computer.
- Lora, Source Sans 3 and Caveat are bundled as Latin and extended-Latin WOFF2
  subsets. They are used when Constantia, Segoe UI or Ink Free is unavailable.
  This preserves the approved Windows appearance while giving other systems a
  predictable fallback instead of an arbitrary installed font.
- The component test has a generated, self-contained HTML version. Its editable
  `runtime.source.html` retains the module import for development.
- Current browser checks detect Edge/Chrome/Chromium and Firefox in common Windows,
  macOS and Linux locations or on PATH, with explicit path overrides available.
- Recording selects a supported browser format and labels the downloaded file
  from the actual recorded MIME type. Formats may be WebM, M4A or Ogg.
- An optional Node preview server handles editable module source files and
  browsers that restrict microphone use when opening local files directly.

## Remaining differences and how to handle them

### Fonts and exact visual matching

The fallback fonts are close alternatives, not copies of the Windows fonts.
Default typography can therefore differ between Windows and another OS. Font
rasterization, zoom and device pixel ratio can also vary. These differences are
not a promise of identical screenshots across operating systems.

For a consistent font comparison on every system, append **?fonts=portable** to
the website or walkthrough's address, before any `#screen` fragment. For example:

```text
journal-website.html?fonts=portable#today
journal-prototype-desktop.html?fonts=portable#auth-login
```

This uses the three bundled families even on Windows. Remove the query to return
to the approved Windows-first font selection. No fonts need to be installed.
For numbered static comps, the equivalent is `data-font-profile="portable"` on
their `html` element when comparing copies; their source defaults remain unchanged.

The included subsets cover the English prototype and extended Latin text. Other
scripts and emoji use the receiving system's fonts. Full multilingual typography
is outside the current prototype. License copies, hashes, download provenance and
original font files are in `assets/fonts`; keep them with a developer handoff.
Licenses are also embedded in the standalone exports. Sources:
[Lora](https://github.com/google/fonts/tree/main/ofl/lora),
[Source Sans 3](https://github.com/google/fonts/tree/main/ofl/sourcesans3),
[Caveat](https://github.com/google/fonts/tree/main/ofl/caveat).

### Microphone permissions and recording

The main website and all three walkthroughs include Compact Transport. Clicking
Record opens the ready recorder and the browser permission prompt. Allowing access
prepares a muted microphone; click **Start recording** to begin. If access is
blocked, Start stays grey and the inline message explains how to retry. Pause
mutes the input; Stop and keep returns to the journal with local audio and a
measured waveform. Resizing the window keeps an active recording running.

Playback uses the recorded sound and its measured waveform, with a fixed timer
column and a smooth progress reveal. Nothing is uploaded or transcribed by this
prototype. Audio and entries still disappear on reload or close. The walkthrough
index's **Recording kept** review route provides Download recording for the latest
memo; the normal website recording flow returns directly to the journal.

Integrated checks are `node scripts/verify-compact-merge.mjs` and its `--firefox`
variant. They copy the website HTML alone into a temporary folder and exercise
permission, capture, playback, resizing and reduced motion. Evidence is under
`verification/compact-merge/`. Firefox audio decoder processes may require running
the check outside an agent sandbox; this does not require changing user browser
or operating system settings.

The browser and operating system must allow microphone access. Open the file
in a normal browser window, allow the permission prompt, and check the OS's
microphone permission if access is denied. Embedded document viewers and some
local-file contexts may restrict recording.

If direct opening does not allow recording, use the optional local preview:

```sh
node scripts/serve-preview.mjs
```

Open **http://127.0.0.1:8000/**. It goes straight to the website preview, with no
index page. The server uses this folder automatically, binds only to this
computer and makes no account requests. Press **Ctrl+C** to stop it. If the port
is occupied, use `node scripts/serve-preview.mjs --port=8001` and open port 8001.

If a browser lacks microphone recording support, try Edge, Chrome or Firefox,
or continue with text entry. Real microphone hardware and Safari/iOS/Android
permission flows must be checked on those devices; they were not physically
tested here. Permission cannot be granted by the prototype itself. See
[the browser microphone requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

Download a recording before closing or reloading if you want to keep it. The
format and extension reflect the browser's output; use a player that supports
that format. Renaming the extension does not convert the audio. Format selection
uses [MediaRecorder support detection](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).
Existing sample memo rows contain fictional transcripts, not recorded audio.

### Browser motion and reduced motion

The review files deliberately carry `data-motion-review="play"`. They continue
to play review motion with Windows animation effects disabled; no OS settings
need changing. Keep that attribute in the files you send.

The composer scroll tuck and note-opening height growth use browser capabilities
described in `MOTION-HANDOVER.md`. A browser without those capabilities displays
the complete layout without those particular movements. Use Edge/Chrome to
review those effects; compare Firefox for the complete static layout and the
shared hover/focus behavior. This is the existing design's intentional capability
policy; do not add an approximate animation fallback.

For production reduced-motion testing, remove the review attribute only in a
test copy or browser inspector. The product styles then respect reduced motion.

### Folder structure and editable sources

Keep numbered comps beside their platform's `00-prototype.html`, with `lock.css`
at the project root. Do not move those comps out individually. Standalone exports
can be moved or renamed independently.

`index.source.html` and `runtime.source.html` use JavaScript modules. Open them
through the local server when testing their interactions, rather than through
`file://`. The generated `index.html` and `runtime.html` inline those modules and
can be opened directly.

The original drive paths in workspace instructions and historical records are
context for the original author. Current build scripts resolve the project from
their own location and do not require `D:\Codex` or the original username.
The earlier ZIP mentioned in README is a historical archive outside this project;
it is not needed to view, build or use this handoff.

## Rebuild and verify, for the receiving developer

Use **Node.js 22 or later**. No npm install or third-party package is required.
Browser verification uses Node's [built-in WebSocket](https://nodejs.org/api/globals.html#class-websocket).
Run these commands from the extracted project folder:

```sh
node scripts/build.mjs
node scripts/verify-website-preview.mjs
node scripts/verify-revision-states.mjs
node scripts/verify-entry-motion.mjs
node scripts/verify-portability.mjs
```

The builds embed the checked-in font assets; they do not download them. Edit the
numbered screens, state generators, `lock.css` outside its generated font block,
or component sources, then rebuild. Do not hand-edit generated exports or
`runtime.html`; edit `runtime.source.html` for the component test.

Browser checks launch temporary test profiles, use fake microphone input where
needed and write evidence under `verification`. If browser detection fails,
provide the executable's full path, not an `.app` directory on macOS:

```powershell
# PowerShell example; replace the path with your installation.
$env:CHROMIUM_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:FIREFOX_PATH = 'C:\Program Files\Mozilla Firefox\firefox.exe'
node scripts/verify-portability.mjs
```

```sh
# macOS example; Linux may use /usr/bin/chromium and /usr/bin/firefox.
CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/verify-portability.mjs
FIREFOX_PATH="/Applications/Firefox.app/Contents/MacOS/firefox" node scripts/verify-entry-motion.mjs
```

`EDGE_PATH` remains supported as an alternative to `CHROMIUM_PATH`. Obsolete checks that attached to an existing debugging browser were moved to the cleanup archive.
Likewise, the old motion-preservation ZIP comparisons predate the approved v3
changes. Do not use their exact-content comparison to judge this revision.

The optional `.ps1` packaging helpers need PowerShell. For an OS-independent
handoff, use the receiving OS's normal Compress/ZIP action on the entire folder;
PowerShell is not required for current builds, previews or browser checks.

## What has actually been verified

- Standalone website opening from a temporary directory with no companion assets.
- Embedded fallback loading; 30 portable-font layouts at 320, 390, 834, 1440 and
  2560px; signup at 320px with 200% text; zero remote asset requests.
- Direct opening of the standalone component test: **Passed**. Editable module
  source also passes through the loopback preview server.
- Local server root, JavaScript/font MIME types, encoded paths and microphone
  availability; existing text/voice, editing, auth and responsive checks in Edge.
- Firefox hover/focus motion, memory controls and production reduced motion.
- Rebuild after relocating the whole folder to a different path containing spaces.

Windows browsers were tested here. The cross-platform paths and bundled fonts are
provided for transfer; actual macOS/Linux/Safari/mobile OS verification remains a
receiving-system check. This is a design prototype: fixed sample data and simulated
account/server outcomes are intentional. New preview content lasts until reload
or close; this handoff is not an account storage service.

## Maintenance build and packaging

Use `node scripts/build.mjs` to normalize source screens, regenerate contextual states and rebuild all current exports in order. `scripts/portable-fonts.mjs` only generates/validates font CSS; `update-portable-fonts.mjs` explicitly writes it to review files.

On Windows, `powershell -ExecutionPolicy Bypass -File scripts/package-handover.ps1` creates a timestamped delivery ZIP containing the current source, standalone exports, build/test tools and docs. Historical studies and QA images are omitted; add `-IncludeVerification` for current evidence. Existing ZIPs are never overwritten. On other systems, zip the current project folder or copy just `journal-website.html` for review.

Earlier studies, migration scripts, outdated checks and historical specimens are optional archive material; they are not needed to open or rebuild the current deliverables. See `docs/CLEANUP-2026-10-07.md`.

### Firefox playback verification

During the cleanup run, headless Firefox in the restricted workspace decoded
recorded audio only as far as metadata and did not advance playback. The untouched
backup reproduced it; Chromium capture/playback and Firefox interface checks passed.
The normal Firefox playback-completion check still needs to be run on the receiving
system: `node scripts/verify-compact-merge.mjs --firefox`. See the cleanup record for
the test evidence and environment limitation. This does not change microphone
permission requirements or the existing saved-audio format fallbacks.
