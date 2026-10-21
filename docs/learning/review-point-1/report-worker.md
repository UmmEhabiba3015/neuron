# Review point 1 — worker report (the fixes)

Spec: `docs/workers/review-point-1-fixes.md`. Returned 2026-10-21.
Saved by the Master Thread as the worker sent it, with the Master Thread's
two follow-up edits at the end.

## 1. What changed
The four fixes the spec asks for. The timing rule of forgot password now has a unit test. Both token hashes go through one function. Comments that cited ignored files or the old day-numbered plan now point at things the repository holds. `useEnterToSave` is now a plain function, and its behaviour is the same.
- `apps/api/src/auth/auth.controller.spec.ts` (new): the controller answers while `PasswordResetService.request` never settles.
- `apps/api/src/auth/hash-token.ts` (new): `hashToken`, SHA-256 hex.
- `apps/api/src/auth/refresh-token.service.ts`, `password-reset.service.ts`: both use `hashToken`; the local copy is gone.
- `apps/api/src/auth/device-name.ts`, `apps/web/lib/devices.ts`: cite docs/features.md Ref 6, 2026-10-15.
- `apps/api/src/auth/password-reset.service.ts`, `apps/web/components/auth/Recover.tsx`: cite docs/features.md Ref 4, 2026-10-15.
- `apps/web/lib/timeline.ts`, `lib/timeline.test.ts`: "Day 34" is feature 3; "Day 29's problem" now says no feature in docs/roadmap.md fixes it yet.
- `apps/web/components/ask/Ask.tsx` (Day 25 is feature 12), `components/today/LiveToday.tsx` (Day 18 is feature 4).
- Two more found in the search: `apps/api/src/auth/refresh-cookie.ts` (Day 31 is feature 8) and `apps/web/components/you/You.tsx` (Day 22's retrieval is Search, feature 10).
- `apps/web/components/day/enterToSaveHandler.ts` (new) replaces `apps/web/hooks/useEnterToSave.ts` (deleted); `Journal.tsx` is its only importer.

## 2. Decisions and assumptions
- The new test uses the real `PasswordResetService`, with only `request()` replaced, so a handler that calls `request()` directly, or awaits it, fails the test.
- `hash-token.ts` sits at the `auth/` root, beside `device-name.ts` and `refresh-cookie.ts`; the conventions give a module no `utils/` folder.
- The new name is `enterToSaveHandler`, because it returns a keydown handler. `'use client'` was dropped from it; `Journal.tsx` is a client file.
- "Day 5 chose that deliberately" and "Day 0 of the next month" were left: the first is history, the second is about dates.
- The You.tsx comment is split across two lines, because the contracts check flags a line with both "10" and "memo".

## 3. Checks
All nine passed. API unit 663 (662 plus the new test), API e2e 68, web 285, contracts 10.

## 4. Mutation
`forgotPassword` changed to `async ... { await this.passwordResetService.request(dto.email); }`. The new test failed: expected "answered", got "still waiting". Restored.

## 5. Browser walk
No screens changed.

## 6. Noticed, not done
- `apps/web/lib/api/session.ts:13` cited "the Day 15c prompt", in the ignored `docs/workers/`.
- `apps/web/styles/live.css:180` cited `docs/learning/day-17a/report.md`, which `.gitignore` excludes.

## 7. Concepts a learner may not know
- `Promise.race`: settles with whichever promise settles first.
- `new Promise(() => {})`: a promise that never settles.
- A React hook is a function that calls other hooks; without one, the `use` prefix only misleads.
- `jest.spyOn(...).mockReturnValue`: replaces one method of a real object.
- An unsalted SHA-256 is enough for a 32-byte random token; a password needs a salted, slow hash (ADR-011).

---

**The Master Thread's follow-up:** the two references in section 6 were
comments only, and were rewritten by the Master Thread: `session.ts` now says
"decided on Day 15 (ADR-018)", and `live.css` "asked on Day 17a".
