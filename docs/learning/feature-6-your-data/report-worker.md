# Feature 6, Your data — worker report

Spec: `docs/workers/feature-6-your-data.md`. Returned 2026-10-17.
Saved by the Master Thread as the worker sent it.

## 1. What changed
Feature 6 is built: deleting an account (Ref 8), export (Ref 36), and the counts and "Keeping since" (Ref 37). The API has `DELETE /auth/me` and `GET /export`, a sweep of the audio folder before the API listens, and a `kind` filter. The web app has a working Your data screen, the delete dialog, and the "Since <month>" box. Dependencies: `pdfkit` 0.20.2 (MIT), `fflate` 0.8.3 (MIT, no dependencies of its own; pdfkit uses it too) and `@types/pdfkit` 0.17.6 (MIT, dev only).
- contracts `index.ts`: `DeleteAccount`, `ExportedDay`, `JournalExport`.
- api `auth/`: `account-deletion.service.ts` (+spec), `dto/delete-account.dto.ts` (+spec), the `DELETE me` handler (wrong password is a 400; the cookie is cleared), and `AudioModule` added to the module's imports.
- api `entries/`: `audio.module.ts` (holds AudioStorage, so auth and export can use it without a cycle), `audio-keys.repository.ts` (the only `withDeleted`), `audio-sweep.service.ts` (+spec), and `AudioStorage` gains `remove`/`keys`. The `kind` filter is in the repository, both query DTOs and the controller.
- api `export/`: module, controller, service, repository, `journal-pdf.ts`, `drawable-text.ts`, DTOs and types, each with a spec where it has logic. CORS now exposes `Content-Disposition`.
- api `shared/dto/` and `shared/types/`: `EntryResponseDto`, `UserResponseDto` and `FiledEntry` moved there, because export now uses them too (CLAUDE.md rule).
- api tests: `no-deleted-rows-asked-for.spec.ts` now allows `withDeleted` in exactly one file. New e2e suites `auth/delete-account`, `export/export` and `app/audio-sweep`. Extended: `main`, `built-output`, `routes-closed`, `search-and-pages`, `voice-memos`, `support/test-database` (`migrateDatabaseFile`).
- web: `lib/your-data.ts` (+test), `components/you/YourData.tsx`, `session.ts` (`deleteAccount`, `receive: 'file'`; +tests), `Gate.tsx`, `AuthForm.tsx`, `app/in/page.tsx` (`?deleted=done`), `You.tsx` (keybox), `unbuilt.ts` (3 entries removed), `live.css` 5.7.

## 2. Decisions and assumptions
- The sweep only removes files whose names are API keys (UUIDs). Anything else in `AUDIO_PATH` is left alone, so a misset path cannot wipe a folder.
- A file the sweep or the deletion cannot remove is logged. The start goes on, and the delete still answers 204.
- The API now refuses to start on a database without migrations, because the sweep reads `entries` first. The `main` and `built-output` suites now migrate their database file.
- `withDeleted` is allowed in `audio-keys.repository.ts` only (it returns keys, never entries). The hard deletes are by criteria and reach soft-deleted rows without asking.
- Export: a memo whose file cannot be read stays in the PDF and JSON without its audio. PDF times use the person's current timezone, and unknown characters become `?`, one per visible character.
- Wording by the worker (hers to change): "Preparing your export.", "Deleting your account.", the unreachable and failed sentences, and the keybox value "Since October 2026" (her line reads "Keeping since October 2026").
- The designer's third dialog button, "Keep my account", was kept, because otherwise a phone has no way to close the dialog. The dialog is a native `<dialog>`.

## 3. Checks
All nine passed: lint, typecheck, build, test (API 662 tests in 55 suites, contracts 10), test:e2e (68 in 22 suites), lint:web, typecheck:web, build:web, test:web (285).

## 4. Mutation
Removed `withDeleted: true` from `AudioKeysRepository.all()`, the sweep's list of kept keys. 4 tests in `audio-sweep.service.spec.ts` failed, including "keeps the file of a soft-deleted memo". Restored.

## 5. Browser walk
Throwaway database, API on 3100, web on 3101, Chromium at 390, 834 and 1440. At each width: You shows "Since October 2026", and Your data shows "2 entries, 1 recording"; export saved `neuron-export-2026-10-17.zip` (the API's date in Karachi), Ready showed, and "download it again" saved the same file; the dialog opened with focus on Export instead, and Escape closed it; a wrong password showed her sentence; the right one landed on `/in?deleted=done` with "Your account has been deleted."; the empty account said "There is nothing to export yet." and sent no `/export` request. The audio folder was empty afterwards.

## 6. Noticed, not done
- At 390 the count value wraps onto two lines ("2 entries, 1 / recording").
- No rate limit on the password check in `DELETE /auth/me`.
- `GET /export` takes no input, so its one bad-input case is a missing token (401).
- Privacy still says deletion "removes everything permanently": true now, but worth her reading again.

## 7. Concepts a learner may not know
- `onApplicationBootstrap`: a Nest hook that `app.listen()` waits for before it opens the port.
- Content-Disposition: the header that names a downloaded file. Browsers hide it from other origins unless CORS lists it.
- WinAnsi (Windows-1252): the only characters Helvetica can draw in a PDF.
- Grapheme: one character a reader sees, which may be several code points (an emoji family is seven).
- ZIP `level: 0`: store a file without compressing it; audio and PDF are compressed already.
- Native `<dialog>` with `showModal()`: makes the page behind it unreachable, and closes on Escape.
- Object URL: a temporary address for bytes in memory, given to a link to save them.

---

## Follow-up after the audit (2026-10-17)

- Her decision: the keybox reads "KEEPING · since October 2026". `keepingSince()` in `lib/your-data.ts` and its tests changed. (A first follow-up had made it "Keeping since October 2026", which repeated the key's word.)
- "Keep my account" was checked in the browser at 390 wide: it closes the dialog and sends no request. The check found a focus bug: on closing, focus fell to the page body. It now returns on the next frame to the Delete account row, or to the Export row after Export instead (`YourData.tsx`).
- The worker stopped before reporting the second follow-up's line widths; the Master Thread ran the nine checks afterwards, all passing (662, 68, 285, 10).
