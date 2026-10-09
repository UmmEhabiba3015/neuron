# Screens Day — Worker report, web: every in-scope screen, in its main state

**Date:** 2026-10-09. Prompt: `docs/workers/screens-day-web-screens.md`.
Binding: `docs/requirements.md`, ADR-021.

---

## Read this first

- **All nine checks pass**, and they were run, before and after the work.
  See *Checks*.
- **The mutation was run.** Removing the edit control's day from the list
  fails the type check, the web build, and two named tests. See *Mutation*.
- **Every unbuilt control was pressed in a real browser** against a real
  API. Each one showed "This is not built yet." and sent **no request** to
  the API (counted before and after each press). See *The walk*.
- **What already worked still works**, in the same walk: creating an
  account, writing, deleting (it still asks), mood, the Timeline, a past
  day's page, signing out, and signing in.
- **Sign in and Forgot password measure identical to their comps** at 390,
  834 and 1440. Sign in now has the "Forgot your password?" link, so it is
  measured against `13-login.html` with nothing removed except the
  prototype's "Prototype states" box.
- **Two product choices are the owner's and are flagged**: one Export row
  or three, and the export row naming recordings. See *Choices for the
  owner*.

`apps/api`, `packages/contracts` and git were not touched. No dependency was
added. `app/styles/lock.css` is the designer's file, byte for byte (`cmp`
exits 0). None of the designer's scripts was run. The owner's database was
not used: its SHA-256 began `79391aa1` before and after. My API ran on 3100
and my web app on 3101, with a throwaway database in my scratch folder. All
are stopped. `pnpm lint` runs the API's `eslint --fix`; `git status` shows no
file under `apps/api` changed.

---

## Objective

Build every in-scope screen in its main state, before the days that wire
their features. A control whose feature is not built is drawn, and a press
of it says "This is not built yet." and does nothing else. A section with no
data behind it is drawn with its heading and the same sentence. Every such
control is listed once, in one file, with its day.

## Implementation summary

- **One list**, `apps/web/lib/unbuilt.ts`: the sentence, defined once, and
  every unbuilt control with its on-screen name, its day, and its screen.
- **One way to draw them**, `apps/web/app/components/NotBuilt.tsx`. A screen
  can only draw an unbuilt control by naming it in the list; its label comes
  from the list. Each carries `data-unbuilt="<name>"`, so in a browser
  `document.querySelectorAll('[data-unbuilt]')` finds every one on a screen.
- **Edit** on each typed entry, before delete, where `#entry-options` draws
  it. On Today and on a past day's page, because both draw the same row.
- **Sign in** gains "Forgot your password?", which goes to `/forgot`.
- **Forgot password** (`/forgot`) and **Choose a new password** (`/reset`).
- **You** gains a second row, Your data. **Your data** (`/you/data`) has
  Export everything and Delete account.
- **Account** gains the timezone row, the signed-in devices section and
  "Sign out everywhere". **Timezone** (`/you/account/timezone`) is new.
- **Drafts: nothing was built.** A draft is data, there is none yet, and the
  owner chose no made-up data. There is no drafts screen and no drafts
  section anywhere.

## Files

**New**

| File | What it is |
|---|---|
| `lib/unbuilt.ts` | The list of unbuilt controls and the sentence |
| `lib/unbuilt.test.ts` | Its tests. No React |
| `app/components/NotBuilt.tsx` | `useNotBuilt`, `NotBuiltYet`, `NotBuiltInPlace`, `NotBuiltRow` |
| `app/screens/Recover.tsx` | Forgot password, and Choose a new password |
| `app/forgot/page.tsx`, `app/reset/page.tsx` | Their addresses |
| `app/you/data/page.tsx`, `app/you/account/timezone/page.tsx` | Your data, and Timezone |

**Changed**

| File | Change |
|---|---|
| `app/components/Journal.tsx` | `LiveEntry` draws the edit icon before delete, and the sentence in the row when it is pressed |
| `app/components/LiveScreen.tsx` | `PushedScreen` takes an optional `title` (the wordmark beside the way back), and `aside` is optional |
| `app/screens/AuthForm.tsx` | "Forgot your password?" on sign in. `PasswordField` is exported, and takes `after`, drawn under the field |
| `app/screens/You.tsx` | You's second row; Account's new parts; `Timezone`; `YourData` |
| `app/styles/live.css` | Rule 5.3 deleted; rule 5.5 added. See *Rules in live.css* |

No existing test was changed.

---

## The addresses

| Screen | Address | Why |
|---|---|---|
| Forgot password | `/forgot` | Like `/in` and `/new`: a screen for a person who is signed out has one short word at the top level. It is also the address `docs/ui-handover.md` 2.1 gave the designer |
| Choose a new password | `/reset` | The same reason, and handover 2.4. On Day 20 the link in the email will carry its token in the address, for example `/reset?token=…`; the path does not need to change for that |
| Timezone | `/you/account/timezone` | The address follows the presses: You, then Account, then Timezone. `/you/account` already sits under `/you` for the same reason |
| Your data | `/you/data` | The designer's |

---

## The unbuilt controls

The list in `lib/unbuilt.ts`, as a table:

| Name in the list | On screen | Screen | What a press does today | Day |
|---|---|---|---|---|
| `editEntry` | The edit icon, "Edit entry" | Today, and a past day's page | The sentence, in the entry's row | 18 |
| `sendResetLink` | "Send reset link" | Forgot password | The sentence, under the button | 20 |
| `saveNewPassword` | "Save new password" | Choose a new password | The sentence, under the button | 20 |
| `signedInDevices` | The section "Signed-in devices" | Account | Not a control: the sentence stands in place of the rows | 34 |
| `signOutEverywhere` | "Sign out everywhere" | Account | The sentence, above the two buttons, where "Signing out." appears | 34 |
| `chooseTimezone` | The list of timezones and "Save timezone" | Timezone | Not a control: the sentence stands in their place | 34 |
| `exportEverything` | "Export everything" | Your data | The sentence, under the row | 34 |
| `deleteAccount` | "Delete account" | Your data | The sentence, under the row. The confirmation dialog is not reachable and not built | 34 |

Links between screens work today, as the owner decided: "Forgot your
password?", "Back to sign in", the You rows, the timezone row, "Leave as it
is", and the way back from Your data.

---

## Every sentence the owner has not seen

**Mine.**

| Sentence | Where | Note |
|---|---|---|
| "Export your journal, or delete the account and everything in it." | You, under Your data | His says "Export entries and recordings, …" |
| "Your name, your email, your timezone, signed-in devices, and sign out." | You, under Account | Replaces Day 17c's "Your name, your email, and sign out." |
| "A day ends at midnight in this timezone. Changing it does not move anything already written." | Account, under Timezone; and the Timezone screen | His, with **4am changed to midnight**. On the Timezone screen his wording ends "what you have already written"; I used one sentence for both places |
| "Your journal as Markdown and as JSON, and your recordings as audio files, in one download." | Your data, under Export everything | His says "Markdown, JSON, and your recordings as audio files. One tap, no email." See *Choices for the owner* |
| "Delete account" | Your data, the row's name | The owner's name for the control. His says "Delete everything" |
| "Use at least 8 characters." | Choose a new password | His first sentence. The number comes from `PASSWORD_MIN_LENGTH` in the contracts. His second sentence is dropped; see *Conflicts* |
| "Show new password" / "Hide new password" | The eye on Choose a new password, for a screen reader | Built the way the other password fields name theirs |
| "Reset your password · Journal", "Choose a new password · Journal", "Timezone · Journal", "Your data · Journal" | Browser tab titles | |

**The owner's.** "This is not built yet."

**The designer's, word for word.** "Forgot your password?", "Reset your
password", "Enter your email address. We will send a link you can use to
choose a new password.", "Email", "Send reset link", "Back to sign in",
"Choose a new password", "New password", "Save new password", "Timezone",
"Signed-in devices", "Sign out everywhere", "Leave as it is", "Your data",
"What is yours", "Take it out", "Export everything", "End it", "Delete this
account and everything in it. Export is directly above this for a reason.",
"Permanent", "Edit entry".

---

## Choices for the owner

Each is a line or two to change.

| Choice | What I built | The other option |
|---|---|---|
| **One Export control or three** | One row, "Export everything", as the comp and `docs/ui-handover.md` 8 have it: one download holding Markdown, JSON and audio. The prompt says "Export as Markdown, as JSON and as audio files … Each shows the sentence", which can be read as three controls | Three rows, one per format |
| **The Export sentence names recordings** | It does, because the owner's table lists "audio files" | The prompt also says "anything about recordings" is not drawn. If that wins, the sentence becomes "Your journal as Markdown and as JSON, in one download." |
| **Delete account says "Permanent"** | Kept. It is true: the delete is hard and has no undo (requirements 3.1.10) | Leave the value empty, as Export's is |
| **Forgot password and Choose a new password are for a signed-out person** | A signed-in person is sent to Today, as sign in does | On Day 20, a signed-in person who opens the email's link probably should see `/reset`. That is a Day 20 decision |

---

## Decisions and assumptions

- **An unbuilt settings row is a button, not a link.** It goes nowhere, and
  a link that goes nowhere is a lie to a screen reader. `live.css` 5.5 makes
  a button look like the designer's row.
- **The sentence stays once shown**, until the person leaves the screen.
  Pressing again changes nothing.
- **The sentence has `role="status"`**, so a screen reader reads it out
  politely. It is not a failure, so it is not an alert.
- **On an entry, the sentence is hidden while the delete question is open**,
  so the row never holds two messages.
- **The Timezone screen has no "Save timezone" button.** The prompt says the
  choice is not built and the sentence stands in its place. A Save with
  nothing to choose would be a control with nothing to act on.
- **The Timezone row shows no value**, and You's Your data row shows no
  count: `WireUser` carries no timezone, and nothing counts entries yet.
- **Not drawn on Account**: the comp's last line, "To choose a new password,
  use the forgot-password link on sign in." It is not in the owner's list,
  and it points to a feature that is Day 20's.
- **Not drawn on You**: the privacy rows, "What the model can see", the
  "Keeping since" box and the foot line. Each is outside this build's list.
- **Not drawn on an entry**: "keep this out of memory".
- **Not drawn anywhere**: anything about recordings except the one export
  sentence above, import, the calendar, and Ask.

---

## Conflicts between the designs and the requirements

| In the design | In `docs/requirements.md` | What I did |
|---|---|---|
| "A day ends at 4am in this timezone" (Account and Timezone) | 3.2.1: midnight | Midnight |
| "This link works once, for 30 minutes." (Choose a new password) | 3.1.7: the link works once and **expires**. No length is decided; 30 minutes is a proposal in the handover | Dropped the sentence. Day 20 decides the time and the words |
| "Use at least 8 characters." | The minimum is defined once in the contracts | The number is read from `PASSWORD_MIN_LENGTH` |
| You: "Export entries and recordings, …" | Recordings are "in, not scheduled" | "Export your journal, …" |
| "148 and 31" on Your data and on You | Nothing counts entries yet; the owner chose no made-up data | Not drawn |
| "Karachi (UTC+5)" on the timezone row | `WireUser` has no timezone | Not drawn |

---

## Rules in `live.css`

- **5.3 deleted.** It pushed the delete icon to the right edge because edit
  was not drawn. Edit is drawn now, so both icons stand where the comp draws
  them. Measured: identical at all three widths.
- **5.5 added**, "A settings row that is a button". It takes away a button's
  own border, font, width and centred text. It is wrapped in `:where()`, so
  it has no weight and every `lock.css` rule still wins. The first version
  did not have `:where()`, and the measurement caught it: it removed the line
  `lock.css` draws between the rows of a sheet.

Section 5 still holds four temporary rules: 5.1, 5.2, 5.4 and 5.5. The
number 5.3 is left empty so earlier reports still point to the right rules.

---

## Tests

`lib/unbuilt.test.ts`, five tests, no React:

1. the sentence is the one the owner chose;
2. every unbuilt control has a day, and that day comes before a real person
   tests the product (Day 36);
3. every unbuilt control has a name on screen and a screen it is on;
4. no two unbuilt controls on one screen share a name;
5. the list is the one the owner decided, each on its day.

The type also guards the list: `satisfies Record<string, Unbuilt>` makes a
missing day a type error, and `UnbuiltName` makes a screen that names a
control not on the list a type error.

---

## Checks

Run from the repository root.

**Before any change**: all nine pass.

**After the work**, as one chain, exit 0:

| Check | Result |
|---|---|
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm build` | clean |
| `pnpm test` | contracts 7 of 7; API 16 suites, 246 of 246 |
| `pnpm test:e2e` | 25 suites, 365 of 365 |
| `pnpm lint:web` | clean |
| `pnpm typecheck:web` | clean |
| `pnpm build:web` | clean. Lists `/forgot`, `/reset`, `/you/data`, `/you/account/timezone` |
| `pnpm test:web` | contracts 7 of 7; web 159 of 159 (154 before, and the 5 new) |

## Mutation

**The line**: `day: 18,` in the `editEntry` entry of `lib/unbuilt.ts`. Every
unbuilt control having a day is the property the owner asked to be tested,
and it is what turns the list into a schedule that Day 36 can be checked
against. Removed, then all nine checks run one by one.

| Check | Result |
|---|---|
| `pnpm lint`, `typecheck`, `build`, `test`, `test:e2e`, `lint:web` | pass (they do not read the web app's types or tests) |
| `pnpm typecheck:web` | **fails.** `lib/unbuilt.ts(22,3): error TS2741: Property 'day' is missing … but required in type 'Unbuilt'.` and six errors in the test file |
| `pnpm build:web` | **fails**, on the same type error |
| `pnpm test:web` | **fails**: 157 of 159. The two that failed: *every unbuilt control has a day, and that day comes before a real person tests the product*, and *the list is the one the owner decided, each on its day* |

The line was put back and all nine were run again: the table above.

**What no test reaches.** The rule "a press shows the sentence and sends
nothing" lives in React (`useNotBuilt` and each screen's `onClick`). If
`press` were made to do nothing, or to send a request, no check would fail.
It is covered only by *The walk* below, which counted requests by hand. This
belongs on the Day 19 list of things a browser test would hold.

---

## The walk

In headless Chromium at 1440, against the real API and the built web app.
"API requests" counts the requests the page had sent to the API, just
before and just after the press.

| Step | Result |
|---|---|
| Create an account | Lands on `/` |
| Write two entries | 2 entries on Today |
| An entry's tools, in order | Edit entry, Delete entry |
| Today: press Edit entry | Sentence shown, in the entry's row, `role="status"`. Requests 11 → 11. Still on `/` |
| Today: press Delete entry | "Delete this entry? This cannot be undone." Focus on "Keep entry" |
| Today: press Good | Pressed |
| A past day (one entry moved to 6 August in the throwaway database) | 1 entry, no composer |
| Past day: press Edit entry | Sentence shown. Requests 4 → 4 |
| Timeline | "OCTOBER 2026 Fri 9 Written today. AUGUST 2026 Thu 6 This one goes to a past day." |
| You | What is yours / Your data / Your account / Account |
| Your data, from You | `/you/data`: Take it out / Export everything / End it / Delete account |
| Press Export everything | Sentence shown. Requests 3 → 3 |
| Press Delete account | Sentence shown. Requests 3 → 3 |
| Back | `/you` |
| Account | Name, Email, Timezone (with the midnight sentence), SIGNED-IN DEVICES, "This is not built yet.", Sign out of this device, Sign out everywhere |
| Timezone, from Account | Timezone / the midnight sentence / "This is not built yet." / Leave as it is |
| Leave as it is | `/you/account` |
| Press Sign out everywhere | Sentence shown. Requests 3 → 3 |
| Sign out of this device | Lands on `/in` |
| Sign in: Forgot your password? | Goes to `/forgot` |
| Press Send reset link | Sentence shown. Requests 4 → 4. The email field keeps what was typed |
| Back to sign in | `/in` |
| `/reset`: show password | The field's type becomes `text` |
| Press Save new password | Sentence shown. Requests 1 → 1 |
| Sign in with the old password | Lands on `/` with its entry |
| `/forgot` while signed in | Sent to `/` |

---

## Measured against the comps

As Day 17a: each comp and the running app in headless Chromium, both 764
tall, at 390, 834 and 1440. Every visible element inside `.app` is recorded
with its position, size and 29 computed style values, and elements are
paired by class names and place in the tree. "Same" means within 0.6px and
all 29 values equal. The comp's state is lifted out of its stage and given
`live.css`, **in the browser's memory only**, so both pages are drawn by the
same two style sheets. Two more adjustments were made to the comp, in memory:
the whitespace of the comp's source is collapsed inside an entry (otherwise
`live.css` 5.2 shows the source's line breaks), and the `pushed` and
`untitled` classes are ignored when pairing (the mobile and tablet comps of
Your data leave `pushed` off; styles are still compared).

Each cell is "elements the same, of elements paired".

| Screen | Comp | 390 | 834 | 1440 |
|---|---|---|---|---|
| Sign in | `13-login.html` | **33 of 33** | **40 of 40** | **40 of 40** |
| Forgot password | `15` `#auth-forgot` | **25 of 25** | **32 of 32** | **32 of 32** |
| Choose a new password | `15` `#auth-reset` | 6 of 25 | 21 of 32 | **32 of 32** |
| Today, two entries | `01-today.html` | 35 of 41 | 33 of 41 | 32 of 40 |
| You | `00-prototype` `#you` | 8 of 21 | 9 of 21 | 8 of 20 |
| Account | `17` `#account-devices` | 10 of 31 | 13 of 31 | 8 of 30 |
| Timezone | `17` `#timezone-choose` | 13 of 18 | 13 of 18 | 10 of 17 |
| Your data | `00-prototype` `#settings-data` | 6 of 15 | 13 of 15 | 13 of 15 |

From Today's comp, these were removed in memory because they are not built:
the recording, the memory control, the notes between entries, "Recent
overview", the microphone and the composer's tools.

### Every difference I could not close, and why

| # | Difference | Where | Why |
|---|---|---|---|
| 1 | One line of copy instead of two; everything below rises 22px | Choose a new password, 390 and 834 | The dropped "This link works once, for 30 minutes." At 1440 the column is wide enough that it does not move anything |
| 2 | No Ask destination; You stands where it was | Every screen with destinations | Ask is Phase 4. Measured and explained on Day 17c |
| 3 | The date and the entry times | Today | Data |
| 4 | The composer is a textarea | Today | `live.css` 5.1, since Day 17a |
| 5 | `text-align` on the two entry icons | Today | They are buttons, and the comp's are links. The icon is centred by `lock.css`'s grid, so nothing moves. **The edit and delete icons stand exactly where the comp draws them, in both entries, at all three widths** |
| 6 | Fewer rows, and every row after the first moves up | You | The privacy rows are not drawn. The rows that are drawn differ in their sentences and in the email |
| 7 | A Name row first; no device rows; the sentence instead | Account | The Name row is Day 17c's, not drawn by the designer. The devices are Day 34's |
| 8 | No timezone value; the email is longer than the comp's | Account | `WireUser` has no timezone. Data |
| 9 | No form and no Save; the sentence instead | Timezone | The choice is Day 34's |
| 10 | No count beside Export; its sentence is wider and, at 390, one line longer, so everything below moves 21px | Your data | No counts. My sentence |
| 11 | "Delete account" instead of "Delete everything" | Your data | The owner's name |

**Not measured.** A past day's page against `06-conversation.html`: it
draws the same entry row as Today, which is measured, and it was walked.
Hover (on a desktop with a mouse, `lock.css` shows an entry's icons only on
hover or focus). Firefox and Safari. The measuring script is in my scratch
folder, not the repository.

---

## Limitations

- **The React rule is not tested**: that a press shows the sentence and
  sends nothing. See *Mutation*.
- **The sentence is drawn when pressed, with `role="status"`.** Some screen
  readers announce a live region more reliably if it exists before its words
  change. This is the pattern the app already uses for "Signing out." and
  "Saving.", so I kept it.
- **`/reset` takes no token yet.** It is reachable by typing the address.
- **Chromium only.**

---

## Concepts a learner may not know

- **`:where()` in CSS**: wraps selectors so that they add no weight; any
  other rule for the same element wins.
- **Author styles beat browser styles**: a rule in our CSS always beats the
  browser's own default for a button, whatever its weight.
- **`as const satisfies Record<string, Unbuilt>`**: checks that every entry
  has the right shape, and keeps each value's exact type.
- **`keyof typeof UNBUILT`**: the type "one of the names in this list", so a
  misspelt name is a type error.
- **A custom hook** (`useNotBuilt`): a function starting with `use` that
  holds a piece of React state for whoever calls it.
- **Spreading an object into JSX** (`{...control.marker}`): puts each field
  of the object on the element as an attribute.
- **`data-*` attributes**: custom attributes for our own use, which the
  browser ignores, here used to find every unbuilt control.
- **`role="status"`**: tells a screen reader to read new words in that
  element aloud when it is free.
- **`event.preventDefault()` on a form**: stops the browser sending the form
  and loading a new page.
- **The Chrome DevTools Protocol**: how the measuring script drives a
  browser, over a WebSocket, without installing anything.
