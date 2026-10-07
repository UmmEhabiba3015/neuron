# Account pages and prototype states

## October plain-paper revision

The main sign-in and registration screens now use the approved plain-paper open
spread at all web widths. The opaque form is softly shaded against a plain page;
the facing-page introduction follows the form on mobile. The binding rail stays
on the left edge. Source screens are `13-login.html` and `14-register.html` in
each web folder, with shared styling in `lock.css` and interaction in
`scripts/prototype-runtime.js`. Rebuild the portable previews normally.

Registration requires the password twice, with a matching value and at least
eight characters. Inline errors preserve input and focus the first invalid
field. The password-length error replaces the hint; editing restores it.
Recovery and hint text sit 8px below the field. Both password controls have
independent eye icons. Switching auth routes keeps the email and clears the
passwords. Valid sign-in opens Today; valid sign-up opens Empty Today. These
remain local preview interactions, with no connected authentication service.

All October auth outcomes in `15-auth-states.html` now reuse this same spread.
Registration error and request states include Confirm password. Recovery still
uses one field, as requested. Reset, deletion, sign-out and session-expiry arrivals
retain the ordinary login form with a single explanatory line. Password visibility
uses the same eye control throughout; length errors replace the standard hint.

> **Current scope:** [V3-REVISION.md](V3-REVISION.md) supersedes the older guest, tier, offline, account and route decisions below. Historical reasoning and the locked visual, accessibility and motion rules remain useful.


September 2026 extension, requested as part of the existing design. All work is in this folder. The established visual system and no-JavaScript delivery remain in place.

## Open and review

- `journal-prototype.html`: mobile web.
- `journal-prototype-tablet.html`: tablet web.
- `journal-prototype-desktop.html`: desktop web.

Before signing in, click **You** to open **Log in**. Once signed in, **You** opens account settings. Choose **Create an account** for registration, or **Forgot your password?** for recovery. Every prototype now has 91 screen fixtures, including 35 signed-in views with persistent progress. The screen index includes every new outcome. Contextual **Prototype states** disclosures let a reviewer branch without returning to the index.

The forms accept fictional details and use native required-field, email and password-length validation. Submitting either login or registration opens account settings immediately. Keeping the journal runs alongside the page as a compact text-and-progress bar below navigation. There is no authentication service, email delivery, microphone access, account mutation or storage operation. Inputs deliberately have no `name`, so native form submission cannot serialize credentials. Never enter a real password into design files.

## Design of record

The existing `direction-lock.md` and `lock.css` remain the design authority, including
their September 2026 extension. This document records routes and handover limitations.

Each web platform has:

| File | Contents |
| --- | --- |
| `13-login.html` | Login, registration link, password recovery, continue as guest |
| `14-register.html` | Registration, guest-content carryover, Free account explanation |
| `15-auth-states.html` | Incorrect details, email already used, pending login/registration, email verification/resend, account created, reset request/sent/new password/completed, expired link, offline, connection failure, expired session, logged out |
| `16-flow-states.html` | Microphone permission/blocked/missing, paused/kept recording, search no matches/offline, insufficient history, reading entries, offline saving, guest retention |

The prototype also includes an answer with its synthesis dismissed while retaining the original excerpts. Its source of record is the existing answer plus the rule in `00-flow.md` that a dismissal removes the claim, never the user's words.

## Flow connections

| Entry | Path |
| --- | --- |
| You in any navbar | Login → pending → existing You account screen |
| Create an account | Registration → pending → verify email → account ready → Today |
| Forgot password | Reset request → email sent → new password → changed → login |
| Account / Log out | Logged out → login or new browser session |
| First-run microphone | Permission → recording → pause/resume or stop/keep → Today |
| Today / Prototype states | Guest retention → registration; offline → keep writing |
| Ask / Prototype states | No matches → search again; offline → saved entries |
| Pro Ask / Prototype states | Reading → answer; insufficient entries → keyword search |
| Answer / That's not right | Synthesis removed; excerpts remain |

The signed-in walkthrough uses `a-` hash routes to keep the progress bar visible when navigating between screens without introducing JavaScript. You returns to settings on these routes. Logout leaves that walkthrough. The bar shows an illustrative 60% snapshot, not an actual transfer; a production build must bind it to the background job and remove it on completion. Static hash navigation cannot represent an actual session, return-to intent, automatic async completion, or inline changes without history entries. The existing prototype uses separate fixture journeys; a registration success does not dynamically rewrite the historical journal fixture.

Email/password, email verification and a 12-character registration minimum are design assumptions for this extension, not a selected backend or security specification. The implementation team must settle provider, password policy, link lifetime and account/guest merge behavior. No Pro trial or payment prompt is added to signup.

## Source and export

Edit numbered design files, platform `00-prototype.html` sources and `lock.css`. `scripts/extend-auth.mjs`, `scripts/finalize-auth.mjs` and `scripts/nonblocking-progress.mjs` record the one-time extension migration; do not rerun them on the finished sources.

Regenerate portable prototypes with `node scripts/build-prototypes.mjs`. Regenerate the existing design-system export after stylesheet changes with `node "design system/build-export.mjs"`. Never edit the portable exports directly.

The extension composes existing sheet, field, button, notice, empty-state and navigation components; no new color role, dialog, spinner, toast or motion primitive is introduced. Existing C3 printed-line and control behaviors apply to the added pages. The native app remains its existing one-screen work in progress; this extension covers the three complete web designs and their prototypes.

Browser verification and screenshots are in `verification/`. Review `auth-checks.json` for route integrity, native form validation, un-serialized input, tap targets and platform widths.

## Nonblocking progress revision

The follow-up request supersedes the full-page login/signup pending states. Their existing hash links now also show settings with inline progress. Privacy, model visibility, data and notification settings are linked within the prototype. Canonical web screens show the same shared progress treatment. On desktop it sits beneath the left navigation; mobile and tablet place it beneath the horizontal navbar. Pages without destination navigation retain it below the page header. Email verification and recovery remain separately reviewable, but do not block the signup demonstration. Browser checks are recorded in `verification/progress-checks.json`.


## Completed motion integration into the current handover

The reference is AIJournal-v2's three platform `_motion` folders. Original numbered motion behavior is retained. The newer account and flow pages now reuse C3 product-line typing on their first introductory sentence, at 820ms / 48 per character; fields, errors, notices and progress remain immediate. Controls reuse the existing 160ms press and 280ms release. The 91 current states per platform, account routing and signed-in progress are preserved. The composer remains tucked beyond 120px and the typing/saved fixtures suppress all arrival effects, including in signed-in copies. Reduced-motion covers those fixtures explicitly. See [MOTION-HANDOVER.md](MOTION-HANDOVER.md) for the integration contract.
