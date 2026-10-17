# ADR-024: Deleting an Account — Rows in One Transaction, Files After, a Sweep at Start

**Status:** Accepted
**Date:** 2026-10-16 (feature 6, Your data)

---

## Context

Deleting an account is a hard delete of the account and everything in it
(`features.md`, Ref 8). An account owns rows in five tables — `users`,
`sessions`, `password_resets`, `days`, `entries` — and, since feature 5,
audio files in `AUDIO_PATH` (ADR-023). Every foreign key is `ON DELETE NO
ACTION`, so a row cannot go while another row points at it.

A database transaction covers the rows and nothing else. The files cannot
share it.

---

## Decision

1. **The rows go in one transaction, children first:** `entries`, `days`,
   `password_resets`, `sessions`, then `users`. A crash before the commit
   leaves the account whole. Soft-deleted entries go too; this is the moment
   ADR-020 kept them for.
2. **The files go after the commit.** The other order could leave an
   account whose memos have lost their audio.
3. **A sweep at start is the safety net.** Before the API accepts any
   request, it removes every file in `AUDIO_PATH` that no `entries` row
   points at, soft-deleted rows included. A crash between the commit and
   the files is finished by the next start. The same sweep removes the
   leftovers of failed uploads (ADR-023).
4. **The sweep runs only before the API listens.** While it runs, an upload
   writes its file a moment before its row (ADR-023), and a sweep in that
   moment would remove a file about to be used.
5. **The person confirms with their password** (her decision, 2026-10-16),
   so a person at an unlocked device cannot delete someone else's journal.

Her choices, 2026-10-16, including her reasoning that the orphan file which
ADR-023 accepted is not acceptable here: the person asked for everything to
be gone.

---

## Alternatives

| Option | For | Against |
|---|---|---|
| **Sweep at start** (chosen) | No new table or scheduler; also cleans feature 5's orphans | A crashed delete's files stay until the next start |
| **A `pending_deletions` table and a retry** (her first idea) | Durable; how large systems do it | Needs work that runs later on its own, which is feature 13's subject |
| **`ON DELETE CASCADE` on every key** | One `DELETE FROM users` | A migration rebuilding four tables, and a cascade that deletes silently wherever a user row is ever removed by mistake |

---

## Accepted costs

- After a crash in the wrong moment, audio of a deleted account stays on
  disk until the API next starts.
- The sweep reads every `audio_key` and lists the folder at each start. At
  Neuron's size this is nothing; with object storage (feature 8) it becomes
  a listing of a bucket, and is revisited.

---

## Revisit when

- Feature 8: object storage replaces the folder.
- Feature 13: scheduled work exists, and the sweep can run on a schedule.
