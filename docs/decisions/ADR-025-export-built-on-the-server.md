# ADR-025: Export Is Built on the Server — a PDF and a ZIP

**Status:** Accepted
**Date:** 2026-10-16 (feature 6, Your data)

---

## Context

Export gives the person their journal as PDF, JSON and audio files
(`features.md`, Ref 36). The JSON is what the API already writes. The PDF
and putting the three into one download are not things Neuron can do today.

---

## Decision

- **One download, a ZIP**, made by the API: `journal.pdf`, `journal.json`,
  and an `audio/` folder with each memo's file as recorded.
- **The PDF is drawn on the server** with a PDF library (`pdfkit` was named
  as the likely one), and **the ZIP** with a small ZIP library (`fflate`,
  which has no dependencies of its own). The worker confirms each licence
  and adds nothing else.
- **What goes in:** every live entry and memo, oldest first, grouped by day
  with its mood. Deleted entries are left out (ADR-020). A memo is listed in
  the PDF as "Voice memo" with its length.

Her choices, 2026-10-16. Her first answer was the same: an export is
expected to be a file.

---

## Alternatives

| Option | For | Against |
|---|---|---|
| **Server PDF and ZIP** (chosen) | One file, the same in every browser | Two dependencies; the standard PDF fonts draw only Latin letters |
| **The browser's "Save as PDF"** for the PDF, a ZIP for the rest | Every script and emoji drawn correctly; no PDF library | Two steps, and the person must choose "Save as PDF" in the print dialog |
| **Three separate downloads** | No ZIP library | Browsers may block several automatic downloads; three files to keep together |

The browser option was the recommendation **if entries were written in a
script other than Latin**, such as Urdu: server PDF libraries in JavaScript
draw such text poorly, and right-to-left shaping hardly at all. She said
Neuron is English only for now.

---

## Accepted costs

- **Characters the font cannot draw**, such as emoji, are replaced in the
  PDF, and never stop the export. The JSON keeps them exactly.

---

## Revisit when

- An entry is written in a script other than Latin. Then the browser's PDF
  is likely the better answer.
- Exports grow large enough that building one in memory matters.
