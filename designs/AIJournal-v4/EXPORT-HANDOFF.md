# Opening, rebuilding and checking Journal on another computer

## Opening

Open **journal-website.html** in a browser. It needs no installation, server or internet, and
can be copied anywhere on its own. The same is true of **journal-skeletons.html**, the three
**journal-prototype*.html** walkthroughs, `design system/index.html`, its component test
`design system/components/tests/runtime.html` (it should say **Passed**) and the module
catalogue in `dist/catalogue/`.

| Deliverable | What to keep together |
|---|---|
| Website, skeleton review, walkthroughs | Each file alone. |
| Design-system guide and component test | Each file alone for viewing; the folder for editing. |
| Module catalogue (`dist/catalogue/`) | The whole `dist/` folder: the pages read `dist/system.css` and `dist/system.js`. |
| Numbered comps (`mobile-web/` and the others) | The whole folder: the comps read `../lock.css`. |
| Source and rebuild | The whole folder. |

### Motion and reduced motion

Every delivered file follows the device's reduced-motion setting. With reduced motion on
(Windows: Settings > Accessibility > Visual effects > Animation effects off; macOS: Reduce motion),
the pages appear without animation, which is the intended product behaviour. Turn it off to see the
motion.

The designer's review copies carry `data-motion-review="play"` on `<html>`, which plays motion
whatever the setting; `node scripts/build.mjs` writes it into the review files, and
`node scripts/package-handover.mjs` removes it from the delivered copies. It is a review tool
only: never ship it.

The composer's scroll tuck and the note's height growth use scroll timelines and
`interpolate-size`. A browser without them shows the complete layout without those two movements;
this is intended, with no fallback animation. Use Edge or Chrome to see them.

### Fonts

The design's fonts are Constantia, Segoe UI and Ink Free (Windows). On other systems the pages fall
back to bundled Lora, Source Sans 3 and Caveat (Latin and extended Latin), so the layout stays
predictable without installing anything. To compare with the bundled fonts on any system, add
**?fonts=portable** before any `#route`:

```text
journal-website.html?fonts=portable#today
```

On a static comp the equivalent is `data-font-profile="portable"` on `<html>`. Other scripts and
emoji use the system's fonts. Licences, hashes and sources are in `assets/fonts/` and inside each
standalone file.

### Microphone and recording

Record opens the recorder and the browser's permission prompt; recording starts on **Start**.
Nothing is uploaded or transcribed: memos last until the page is reloaded. If the browser won't
record from a local file, serve the folder:

```sh
node tools/serve-preview.mjs        # then open http://127.0.0.1:8000/
node tools/serve-preview.mjs --port=8001
```

It serves this folder to this computer only. It is also needed to open the editable
`*.source.html` files, which use JavaScript modules. Real microphones and Safari, iOS and Android
permission flows were not tested and need checking on those devices.

## Rebuilding

Node.js 22 or later; no npm install, no third-party packages. From this folder:

```sh
node scripts/build.mjs
```

One ordered build: the modules in `system/` into `dist/`, every numbered screen from its page
module and comp (`system/modules/pages`, `system/comps`), the walkthroughs, the website and
skeleton review, the motion index and the design-system guide. Edit `system/` and
`design system/index.source.html`; never hand-edit generated files (the numbered screens,
walkthroughs, website, `dist/`, `design system/index.html`, `runtime.html`).

## Checking

The checks test the review build, so **run `node scripts/build.mjs` first**: it writes the review
copies with the motion switch, which the motion checks need on a computer with reduced motion on.
Package again afterwards to get delivery copies without it.

Browser checks find an installed Edge, Chrome or Chromium (override with `CHROMIUM_PATH` or
`EDGE_PATH`) and Firefox (`FIREFOX_PATH`), use throwaway profiles and a fake microphone, and write
their results under `verification/`:

```sh
node scripts/build.mjs
node scripts/verify-portability.mjs
node scripts/verify-website-preview.mjs
node scripts/verify-v3-runtime.mjs
node scripts/verify-revision-states.mjs
node scripts/verify-navbar.mjs
node scripts/verify-writing-companion.mjs
node scripts/verify-compact-merge.mjs
node scripts/verify-cleanup.mjs
```

Give the full path to the browser's executable, not a macOS `.app` folder:

```sh
CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/verify-portability.mjs
```

## Packaging

```sh
node scripts/package-handover.mjs [output folder]
```

Writes the handover to `export/AIJournal-v4` (or the folder given), from an explicit list, and
removes the motion review switch from the delivered pages. It never overwrites an existing folder.
