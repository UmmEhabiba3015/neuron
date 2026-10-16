# Feature 5, Voice memos — worker report

Spec: `docs/workers/feature-5-voice-memos.md`. Returned 2026-10-16.
Saved by the Master Thread as the worker sent it.

## 1. What changed
Voice memos (Refs 21–23) are built. A memo is a row in `entries` with `kind` = `Voice`. Its audio is written to a folder (`AUDIO_PATH`) through `AudioStorage`, and the file is always written before the row. Audio leaves the API only through `GET /entries/:id/audio`, with the owner in the `WHERE`. On the web, Talk records with start, pause, resume, stop and keep, and cancel. Today shows memos as they upload, with a retry, and plays them from an object URL. Memos are deleted like entries and have no edit icon.
- contracts: `EntryKind`, `VOICE_MEMO_MAX_MINUTES`, `VOICE_MEMO_TYPES`, `CreateVoiceMemo`; `Entry` gains `kind` and `durationMs`, and `content` is `string | null`. Two contract tests added.
- api: migration `1792150486058-AddVoiceMemos` (hand-written rebuild, plus `CHK_entries_kind`); entity; `audio-storage.ts`; `voice-memo-rules.ts`; `interceptors/voice-memo-size.interceptor.ts`; `dto/create-voice-memo.dto.ts`; four `types/` files; controller, service, repository, module, response DTO; `AUDIO_PATH` in `env.validation.ts` and `.env.example`.
- api tests: specs for the storage, the rules, the interceptor, the DTO, the migration and `voice-memos.spec.ts`; `test/entries/voice-memos.e2e-spec.ts`; e2e setup gives each suite a temporary `AUDIO_PATH`.
- web lib: `recorder.ts`, `uploads.ts`, `playback.ts` (each with tests), `microphone.ts` (the thin `MediaRecorder` wrapper, untested), `session.ts` (`form` and `receive: 'blob'`), `today.ts` (a memo cannot be edited), `format.ts` (durations), `client.ts` (one page-wide upload list, cleared on sign-out), `unbuilt.ts` (`startRecording` removed).
- web components: `Talk.tsx` rewritten; in `Journal.tsx`, `EntryTools`, `LiveMemo` and `PendingMemo` replace the unused `LiveRecording`; `DaySheet`, `LiveToday` and `LiveTimeline` changed.

## 2. Decisions and assumptions
- Size cap: 24,000,000 bytes, which is 10 minutes at 320 kbit/s. The web records at 128 kbit/s. A too-large upload is a 400: refused from `Content-Length` before any of it is read, or stopped at multer's limit (its 413 is turned into a 400).
- An empty file is a 400. `durationMs` must be a whole number from 1 to 600000.
- Multer drops the codec part of the type, so `audio_type` is stored as `audio/webm` or `audio/mp4`.
- Default `AUDIO_PATH` is an `audio` folder beside whichever database is in use, so a throwaway database never shares the owner's folder.
- The migration's `down()` refuses while any memo exists. The generated migration also rebuilt three unrelated tables; that was left out. A later drift check showed no difference for `entries`.
- The 10-minute limit keeps the memo, stays on Talk, says her sentence, and offers "Return to Today". Discard returns to Today. Leaving the page while recording keeps the memo.
- Wording by the worker, not her: "Waiting for microphone access." and the playback failure lines ("…The recording did not play."). Microphone errors other than "not found" show her refused sentence.
- A Timeline row for a memo shows no text. An empty search now uses `id IS NULL`, because `content IS NULL` would have matched every memo.
- `@types/multer` was not needed. One old migration test (AddUserNameAndTimezone) now reads entries after running every migration, because the repository asks for the new columns.

## 3. Checks
All nine passed: lint, typecheck, build, test (contracts 10, API 601 in 49 suites), test:e2e (59 in 19 suites), lint:web, typecheck:web, build:web, test:web (contracts 10, web 270).

## 4. Mutation
Removed `userId` from the `WHERE` in `EntriesRepository.findAudio`. Two tests failed: "voice memos (EntriesService) › readAudio › gives nobody else another person's memo" and the e2e "is a 404 for another person's audio…". The line is restored.

## 5. Browser walk
Headless Chromium through the DevTools Protocol with a fake microphone; API on 3100 and web on 3101, on a throwaway database. At 390, 834 and 1440, with no console errors and no sideways scrolling: record, pause (clock stops), resume, cancel then keep recording, stop and keep; Today shows "Saving your recording." with no time, then the time and duration; no edit icon and no text on the memo; play from a `blob:` URL, then pause; a failed upload shows her sentence, and Try again saves it; cancel then discard keeps nothing; delete removes the memo; a refused microphone shows her sentence and "Try again". The 10-minute stop was not walked; it is covered by unit tests.

## 6. Noticed, not done
- On Talk at tablet and desktop widths, the left rail is drawn over the content. The ready state did this before this change.
- Leftover audio files (from a failed insert) are never cleaned up, as ADR-023 accepts.
- The owner must run `pnpm migration:run` before the API starts.

## 7. Concepts a learner may not know
- Multipart form: one request carrying a file and text fields, divided by a boundary string.
- Multer: the Express library Nest uses to read multipart forms; `limits.fileSize` stops a file at the cap.
- Object URL: a local `blob:` address that lets `<audio>` play bytes that were fetched with a token.
- `MediaRecorder` / `getUserMedia`: the browser's interfaces for recording audio and asking for the microphone.
- CHECK constraint: a rule the database itself enforces on every row.
- `StreamableFile`: how a Nest controller answers with raw bytes and a content type.
