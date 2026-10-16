# ADR-023: Audio Files Live on the API's Disk, Behind `AudioStorage`

**Status:** Accepted
**Date:** 2026-10-16 (feature 5, Voice memos)

---

## Context

A voice memo is an entry of another kind, in the same `entries` table
(`features.md`, Ref 21). Its words are a few bytes; its audio is about
500 KB to 1 MB a minute, several hundred times a typed entry.

Neuron keeps everything in one SQLite file, which moves to Postgres in
feature 8. Audio in a column would make that file grow by megabytes a day,
and every backup, copy and the move to Postgres would carry it. A database
is built to find and change small records; a file store is built to hold
large bytes.

---

## Decision

- **The row keeps a key, not the bytes.** The `entries` row of a memo holds
  the key of its audio file and the facts about it (its type, its length);
  the bytes live in a file.
- **Until feature 8 the files are in a folder on the API's own disk**, set
  by one setting checked at start (ADR-007), as `DATABASE_PATH` is.
- **The rest of the API talks to a small `AudioStorage`**, never to the file
  system, the same pattern as `MailService` (ADR-022). Feature 8 adds an
  object-storage kind, and nothing else changes.
- **The folder is never served as it is.** Audio leaves the API only through
  a signed-in route that finds the entry with its owner in the `WHERE`
  clause (ADR-013). A folder served as plain files would let anyone with an
  address play another person's memo.
- **The file is written first, and the row only after that succeeds.** A
  crash between the two leaves a file no row points at, which harms nobody.
  The other order could leave a memo on the page whose audio does not exist.
- **A memo is a row with `kind` = `Voice`.** `EntryKind` (`Text`, `Voice`)
  is an enum in `packages/contracts`. A memo's `content` is `NULL` until it
  has a transcript (feature 11), so the column becomes nullable and
  `Entry.content` becomes `string | null`. The empty string was the
  alternative; it would have given one value two meanings.
- **Keyword search is unchanged.** A memo without words matches nothing,
  and once its transcript is its `content`, search finds it with no change.
- **A memo cannot be edited**: `PATCH` refuses it (`features.md`, Ref 11).

Her choices, 2026-10-16. The order of the two writes is her reasoning.

---

## Alternatives

| Option | For | Against |
|---|---|---|
| **The API's disk** (chosen) | Nothing to sign up for, configure or pay for; one setting | Files and database are two places, and a server's disk is lost if the server is replaced, which matters only once Neuron is hosted |
| **Object storage now** (S3 or a compatible service) | Where the files end in production | An account, credentials and a library for a problem that does not exist on her laptop; the provider belongs with the hosting choice |
| **A column in `entries`** | One place, one transaction | The database carries every byte of audio forever |

---

## Accepted costs

- **A file can be left with no row**, after a crash or a failed insert.
  Nothing removes such files yet.
- **The browser cannot play the route directly.** The access token lives in
  memory (ADR-018), and an `<audio src>` request cannot carry the
  `Authorization` header. The web app fetches the audio with the header and
  gives the bytes to the player as a local object URL.

---

- **The 10-minute limit is enforced by size, not by measured length.** The
  API caps the file at 24 MB and checks the `durationMs` the browser sends,
  but it does not measure the audio; that needs a container parser or
  `ffmpeg`. Someone who bypasses the web app can store a longer recording
  within 24 MB. Only their own journal is affected, and the size cap still
  bounds the disk. She found this gap herself.

## Revisit when

- **Feature 8, Going live.** Choose object storage with the hosting, add its
  `AudioStorage`, and move the files.
- Orphaned files take noticeable space.
- Feature 16, Security pass: whether the measured length must be checked.
