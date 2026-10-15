# Feature 2, Forgot password — worker report

Spec: `docs/workers/feature-2-forgot-password.md`. Returned 2026-10-15.
Saved by the Master Thread as the worker sent it.

## 1. What changed
Forgot password now works end to end. `POST /auth/forgot-password` always answers 204, then in the background stores a reset (only the SHA-256 hash of a 32-byte token, expiring after 30 minutes) and writes the email to the log through `MailService`. `POST /auth/reset-password` takes a token and a password. If the link works, it stores the new argon2id hash, marks this reset and every other unused reset of the user as used, revokes every session, and answers 204. Any link that does not work gets one and the same 400. `users.password_hash` is now NOT NULL. `/forgot` and `/reset` are wired, and sign in shows her sentence after a reset.
- contracts: `ForgotPassword`, `ResetPassword`, `PASSWORD_RESET_LIFETIME_MINUTES`; one contract test added.
- api `shared/mail/` (service, module, spec) and `shared/types/email.interface.ts`.
- api `auth/`: `password-reset.service.ts`, `password-resets.repository.ts`, `entities/password-reset.entity.ts`, two DTOs, a spec for each; the controller has the two routes and `INVALID_RESET_LINK`; the module is wired.
- api migrations `1792063401155-RequireUserPasswordHash` and `1792063401156-AddPasswordResets`, plus a spec for each.
- api users: `setPasswordHash` (repository and service); the entity's `passwordHash` is now `string`.
- api tests: `test/auth/forgot-password.e2e-spec.ts`; `routes-closed` lists the two open routes; `SEEDED_PASSWORD_HASH` replaces the null hashes in specs.
- web: `lib/recover.ts` and its test; `session.forgotPassword` and `session.resetPassword` with tests; `Recover.tsx` rewritten; `AuthForm` takes `afterReset`; pages `/in` and `/reset` read `searchParams`; the `unbuilt.ts` entries are removed; `live.css` 5.6 styles a link inside a notice.

## 2. Decisions and assumptions
- `MailService` is in `shared/mail/`, because mail belongs to no domain.
- The 30 minutes is a contract constant, because the API sets it and the web app says it.
- The whole request (lookup, insert, email) runs after the 204, not only the email, so the timing is the same for any address.
- `reset()` hashes the password before its transaction: the database has one connection, so a slow transaction would take in other requests' queries.
- `RequireUserPasswordHash.down()` closes TypeORM's empty transaction, switches foreign keys off and opens a new one. Without this SQLite refuses DROP TABLE users. `defer_foreign_keys` and renaming did not work; both were tested.
- Sign in learns of the reset from `/in?reset=done`.
- Without a token, `/reset` shows the bad-link sentence, and "Ask for a new one." is the link to `/forgot`.
- After "sent", the forgot form is hidden.
- New wording chosen by the worker: "Sending the link." and "Saving your new password." while in flight. The failure sentences reuse sign-in's.
- `ForgotPasswordDto` uses `IsEmail`, as register does. `ResetPasswordDto` requires a non-empty token of at most 256 characters.

## 3. Checks
All nine passed: lint, typecheck, build, test (469 API tests and 8 contract tests), test:e2e (46), lint:web, typecheck:web, build:web, test:web (217).

## 4. Mutation
Replaced the `markUsed(found.id, now)` call in `reset()` with `true`. "lets only one of two requests with the same link through" failed. The sequential single-use tests still pass under that mutation, because `markAllUsedForUser` also marks the reset used. `markUsed` matters only when two requests race.

## 5. Browser walk
Headless Chromium (playwright-core from another local project, nothing added to Neuron), the API on 3100 (throwaway DB) and the web app on 3101, at 390, 820 and 1440 wide. At each width: forgot (empty submit, then sent); the link copied from the API log; reset (too short, mismatch, show password, save); sign in after reset (the old password answered 401), then Today; the used link refused, and `/reset` with no token. No horizontal scroll, no page errors. The could-not-reach sentence appears on both screens when the API is stopped. One fix: the link in the notice showed in browser-default blue.

## 6. Noticed, not done
- A signed-in person who opens a reset link is sent to Today (the existing `SignedOutOnly` behaviour).
- `migration:generate` reports differences for sessions, days and password_resets: TypeORM's own constraint names and the `lower(email)` index. No column differs.
- Reset requests have no rate limit (the design has an `auth-forgot-rate` state).
- Expired and used resets are never deleted.

## 7. Concepts a learner may not know
- Fire-and-forget: start a promise without awaiting it, and catch its errors.
- Timing side channel: how long an answer takes can reveal a secret.
- Conditional UPDATE (`WHERE used_at IS NULL`) as a single-use guard.
- SQLite ignores `PRAGMA foreign_keys` inside a transaction.
- Next.js `searchParams` is a promise, so a page that reads it is rendered on each request.
- `jest.spyOn(Logger.prototype, 'log')` lets a test read what the app writes to its log.
