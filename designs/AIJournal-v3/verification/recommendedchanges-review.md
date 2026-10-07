# RecommendedChanges prototype review

Reviewed 7 October 2026 against `../RecommendedChanges.md` and the current mobile,
tablet and desktop designs. The requested scope is a design prototype. Fixed
emails and counts, example entries, simulated server responses, downloads and
account transitions are accepted fixtures.

## Result

All six outstanding design/state gaps have been addressed. No further missing
design requirement was found in the twelve developer sections at prototype scope.
`RecommendedChanges.md` itself was not changed.

| Previously outstanding | Current design |
|---|---|
| Your data always obscured by deletion confirmation | Ordinary data page; Delete everything opens a separate confirmation. Cancel returns to data. Failed deletion keeps the same dialog and page. |
| Auth outcomes used the older layout | All auth states use the approved plain-paper spread, eye controls and consistent field spacing. Signup variants include Confirm password; arrivals keep the ordinary login form. |
| No complete day before model features | Full Today and past-day examples with entries, audio playback controls, memory and mood. No model notes, glance or transcript. Today alone has a composer. |
| Failures detached from the relevant content | Save retains draft and Save; upload retains audio/play/retry and loss-on-close wording; mood shows Low as saved; entry edit/delete failures retain their row; device failure retains the Account list. |
| Loading shells did not match their destination | Actual Today, Timeline, day, Ask and You shells. Correct navigation/title/date or back link. Earlier loading and the end of Timeline retain the list. Destination and past-day fetch failures have retry. |
| Account variants omitted unrelated information | Single-device, device removed and failed sign-out variants retain email, timezone, current-device dates, sign-out and password-reset guidance. No success notice after removing a device. |

## Developer sections

| Section | Status | Prototype evidence |
|---|---|---|
| 1. Scope decisions | Covered | Account-required entry, email/password, voice and memory controls; web layouts only. Retired guest/tier/offline features removed from active web screens. |
| 2. Forgot password | Covered | One-field request and reset flows with validation, request, sent, rate limit, network and expired-link states; uniform confirmation, 30-minute single-use copy, plain-text reset email, login arrival. |
| 3. Sign in, create account, first run | Covered | Main plain-paper login/signup; validation, wrong-details, pending, rate-limit and network states. Signup adds the user-requested confirmation field. Empty Today and four login arrival contexts represented. |
| 4. Existing screens without tiers/guests | Covered | Current screens retain shared features; whole Today and past-day examples without model output; audio without transcript; three-week return uses the agreed verbatim echo. |
| 5. Loading, failure, not found | Covered | Correct loading shells and Timeline footer states; contextual save/upload/mood failures; destination/day fetch retry, not-found, server error and expired-session arrival. Whitespace remains record mode. |
| 6. Delete one item | Covered | Typed-entry and recording delete controls, in-place confirmation and failure; deleted and last-item-of-day outcomes; accurate hidden-storage retention wording. |
| 7. Delete account | Covered | Confirmation over Your data, account/items/every-device wording and counts; filled Export instead; pending, failure and ordinary login arrival after deletion. |
| 8. Export | Covered | Data row plus preparing, ready, empty and failed states. Markdown, JSON and audio wording; retry/download control remains available. |
| 9. Devices and signing out | Covered | Complete Account page with current-device identification and first/last dates, multiple/only-device variants, removed row without a success notice and unchanged list on failure. Current/everywhere sign-out arrivals. |
| 10. Removed features | Covered | Import/source marks, extra trackers, notifications, Timeline totals, offline, crisis detection and plan/upgrade content removed from active web screens. Four You rows; persistent support resource retained. |
| 11. Edit entry | Covered | Written entries only; original timestamp, save/cancel, empty validation and retained changed text on failure. Past-day entry controls remain available without a composer. Voice has no edit control. |
| 12. Timezone | Covered | Account city/offset row, full supported native timezone selection, 4am and unchanged-past-day wording, unchanged-setting failure state. Browser-derived initial timezone remains a documented build rule. |

## Verification

- `scripts/audit-v3.mjs`: zero route, duplicate-ID or retired-content findings.
- `scripts/verify-revision-states.mjs`: 147 state checks at 390, 834 and 1440px;
  deletion/cancel routing, state password eyes and four 320px layouts with 200% text.
- `scripts/verify-website-preview.mjs`: portable file, responsive layouts, text and
  voice interactions, entry actions, auth validation and breakpoint draft retention.
- `scripts/verify-entry-motion.mjs`: Firefox hover/focus motion and production
  reduced-motion behavior. Review playback still works with Windows animation off.
- Representative screenshots of auth validation, deletion, upload failure,
  model-free days and Account failure were opened and visually reviewed.

The real API, account persistence, email delivery, export archive and synchronized
records are implementation work for the frontend/backend team, outside this review.
