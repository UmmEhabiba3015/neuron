# Feature 3, Account and devices — worker report

Spec: `docs/workers/feature-3-account-and-devices.md`. Returned 2026-10-16.
Saved by the Master Thread as the worker sent it.

## 1. What changed
Account now lists the devices where the person is signed in. Each other device has a working Sign out, and "Sign out everywhere" works. The Timezone screen changes the timezone. In the API: two new columns on sessions, `GET /auth/sessions` now answers the new `Session` shape, and there are two new routes, `DELETE /auth/sessions/:id` and `PATCH /auth/me`. `User` now carries `timezone`. A future day with live entries is no longer a 404. The three feature-3 entries are gone from `lib/unbuilt.ts`.
- `packages/contracts/src/index.ts`: `User.timezone`, `Session`, `UpdateTimezone`
- `apps/api/src/database/migrations/1792068353868-AddSessionDevice.ts` (+ `index.ts`), `add-session-device.spec.ts`
- `apps/api/src/auth/device-name.ts` (+ spec); `dto/session-response.dto.ts` (+ spec); `dto/update-timezone.dto.ts` (+ spec)
- `apps/api/src/auth/{auth.controller,auth.service,sessions.repository}.ts`, `entities/session.entity.ts`, `auth.service.spec.ts`
- `apps/api/src/users/{users.service,users.repository}.ts`, `dto/user-response.dto.ts`, `entities/user.entity.ts` (+ specs)
- `apps/api/src/days/{days.controller,days.service,days.repository}.ts` (+ specs): `exists()` and `hasLiveEntry()`
- `apps/api/test/auth/devices.e2e-spec.ts`, `test/auth/timezone.e2e-spec.ts` (new); `future`, `responses`, `accounts`, `sign-in` e2e updated; `add-password-resets.spec.ts` down() test now undoes the later migrations first
- `apps/web/lib/devices.ts`, `lib/timezone.ts` (+ tests); `lib/api/session.ts` (`signOut(scope)`, `setTimezone`) (+ tests); `lib/utils/format.ts` (`formatDateIn`) (+ test); `lib/unbuilt.ts` (+ test)
- `apps/web/components/you/Devices.tsx` (new), `components/you/You.tsx` (Account, Timezone)

## 2. Decisions and assumptions
- The migration is written by hand. The generated one rebuilt every table (password_resets, sessions, days) and could not fill a NOT NULL `last_used_at`. sessions is rebuilt so that `last_used_at` can be NOT NULL and old rows take `created_at`; `down()` drops the two columns in place. The generated one was read and kept out of the repository; the column definitions match the entity.
- Device naming: a known browser on an unknown system is just "Firefox". Edge's mobile names (EdgA, EdgiOS), CriOS and FxiOS are recognised.
- `revoke` now takes the user id, and also refuses an expired session. Expired counts as "already ended", so it is a 404.
- `GET /auth/sessions` is ordered by `lastUsedAt` DESC, then `createdAt` DESC.
- In the web app, a 404 from a device's Sign out removes the row too, because that device is not signed in either way. The current device's row has no value text and no button.
- Saving a timezone always sends the request, then goes to Account with `router.push`. The person's own zone is added to the list if the browser does not list it (UTC is missing from Node's list).
- The timezone label is "Zone (UTC+5)", and "UTC+0" for zero, computed at the moment the screen is drawn.

## 3. Checks
All nine passed: lint, typecheck, build, test (contracts 8, API 516 tests in 43 suites), test:e2e (53 tests in 18 suites), lint:web, typecheck:web, build:web, test:web (contracts 8, web 233).

## 4. Mutation
Removed `userId` from the `WHERE` in `SessionsRepository.revoke`. Two tests failed: "AuthService › signing out › does not end another person's session" and "signed-in devices (e2e) › answers another person's session with a 404, and leaves it signed in". Both pass again after restoring the line.

## 5. Browser walk
Headless Chromium at 390, 820 and 1280 widths, the API on 3100 (`/tmp/neuron-worker-3.db`, deleted afterwards), the web app on 3101. Walked: Account with three devices (Chrome on Windows current, Firefox on Linux, Safari on iPhone); signing out the iPhone (its row left the list); Timezone (Asia/Karachi (UTC+5) chosen), saved as America/New_York, back on Account showing "America/New_York (UTC-4)"; "Sign out everywhere" went to /in and stayed there after a reload. No page scrolled sideways.

## 6. Noticed, not done
- The User-Agent header is stored raw, with no length cap. Node caps headers at about 16 KB.
- A browser may list another spelling of the stored zone (Asia/Kolkata against Asia/Calcutta), and then both appear in the list.
- `PATCH /auth/me` has a 404 branch for a user who vanished mid-request that no test can reach.
- playwright-core from another local project was used for the walk only, not added to this repository.

## 7. Concepts a learner may not know
- User-Agent: the header in which a browser describes itself. Browsers copy each other's names into it, which is why the order of the checks matters.
- Table rebuild: SQLite cannot add a NOT NULL column filled from another column, so the table is copied into a new one and renamed into place.
- `EXISTS` subquery: asks whether at least one matching row exists, without reading any of them.
- `longOffset`: an Intl option that writes a zone's distance from UTC at a given moment, such as "GMT+05:30".
- `useSyncExternalStore`: the React hook that draws from a store kept outside React, such as `lib/devices.ts`.
