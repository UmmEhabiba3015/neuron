# Journal — changes requested to the design

**For:** the UI designer.
**From:** the team building the API and the web app.
**Started:** 2026-10-04. This document grows as decisions are made. Each
section says whether it is ready to draw.

You do not need to know the codebase to use this. Each section says what the
product will do, which screens are needed, and which states each screen has.

Your own rules still apply to everything here. In particular: no disabled
controls (a thing that cannot be done yet is explained in a sentence, in
place), the component inventory stays closed at thirty seven, the product
speaks in rust and the user writes in ink, and nothing uses colour alone to
carry information.

---

## Status of each section

| # | Section | Status |
|---|---|---|
| 1 | Scope decisions that affect the designs | Ready |
| 2 | Forgot password | **Ready to draw** |
| 3 | Sign in, create account, first run | **Ready to draw** |
| 4 | What each existing screen becomes without guests and without tiers | **Ready** |
| 5 | Loading, failure and not-found states | **Ready to draw** |
| 6 | Deleting one entry or one recording | **Ready to draw** |
| 7 | Deleting the account | **Ready to draw** |
| 8 | Export | **Ready to draw** |
| 9 | Devices, and signing out | **Ready to draw** |
| 10 | Features removed from the designs | **Ready** |
| 11 | Editing an entry | **Ready to draw** |
| 12 | Timezone | **Ready to draw** |

---

## 1. Scope decisions that affect the designs

These are settled. They are listed so that nothing in the existing screens is
drawn or maintained for a feature that will not be built.

| Decision | What it means for the designs |
|---|---|
| **An account is required. There are no guest sessions.** | Every guest state is removed. Detail comes in section 4. |
| **Sign in is by email and password.** | No emailed code and no passkey. Detail comes in section 3. |
| **There is a forgot-password flow.** | New screens. Section 2. |
| **The product does not work offline.** | The offline states of Today, `/talk`, Timeline and Ask are not built. The "saved on this device" marker is not needed. What the screen shows when a request fails is covered in section 5. |
| **Voice memos are in scope.** | Record, keep and play back. Transcription comes later in the build, and is for everyone. |
| **"Keep this out of memory" is in scope.** | The per-entry option and the visible mark on an excluded entry stay as drawn. |
| **The product does not try to detect distress.** | State 6 of the states pack, the crisis card under a completed entry, is not built. The always-present resource in settings and in the composer overflow stays. |
| **The native mobile app is out of scope for now.** | Stage 5 (`mobile-app/`) is paused. Nothing further is needed there. Mobile web, tablet web and desktop web are the whole product for this build. |
| **There are no tiers.** | No Free and no Pro. Everyone gets the whole product. The plan page and the upgrade screen are removed. Section 4. |

---

## 2. Forgot password — ready to draw

### What the product will do

A person who has forgotten their password asks for a reset link by entering
their email address. The product sends an email containing a link. The link
opens a page where they choose a new password. After that they sign in with
the new password.

Four facts about the behaviour shape the screens:

1. **The product never says whether an email address has an account.** The
   confirmation message is the same for a real account and for an address
   nobody has registered. This is the same rule as sign in, where a wrong
   email and a wrong password produce one identical message. Please do not
   draw a "no account found" state; it must not exist.
2. **The link works once, and for a limited time.** The proposed limit is 30
   minutes. A link that has been used, or has run out, leads to a state that
   says so and offers a new one.
3. **Changing the password signs the person out everywhere.** Every device
   that was signed in has to sign in again with the new password.
4. **After choosing a new password the person lands on sign in**, with one
   line confirming the change. They are not signed in automatically.

### Screens needed

All of these are needed at 390, 834 and 1440, like every other screen.

#### 2.1 A way in, on the sign-in screen (`/in`)

One text link, for example "Forgot your password?". It goes to `/forgot`. It
is the only addition to the sign-in screen from this section.

#### 2.2 Ask for a link (`/forgot`)

One field, for the email address, and one action.

| State | What the screen shows |
|---|---|
| **Empty** | The field, the action, and one sentence saying what will happen: a link will be sent to this address. A way back to sign in. |
| **Not an email address** | The person pressed the action with something that is not an email address, or with nothing. A sentence in place, next to the field. The field keeps what they typed. |
| **Sending** | The moment between pressing the action and the answer. Your rules exclude spinners, so this is a plain line of text, in the same way that "thinking" is on the answer screen. |
| **Sent** | Replaces the form. Says that if an account exists for that address, a link has been sent, and that the link works for 30 minutes. Shows the address they typed, so a typing mistake is visible. Offers "use a different address" and a way back to sign in. **This state is identical whether or not the account exists.** |
| **Asked too many times** | The product limits how often a link can be requested. A sentence saying to wait a few minutes and try again. |
| **Could not reach the server** | The request failed. A sentence saying it did not go through, and the action is still available to try again. The field keeps what they typed. |

#### 2.3 The email

This is the first email the product sends, so it sets the pattern for any
later one. It needs:

- A subject line.
- One sentence saying a password reset was asked for.
- The link, as a clearly visible action and also as a plain address that can
  be copied.
- A sentence saying the link works for 30 minutes and only once.
- A sentence saying that if they did not ask for this, they can ignore the
  email and nothing changes.

Please keep it plain. Many mail programs strip styling and block images, so
the email has to read correctly as text alone. The register is the product's
usual one: unexcited, no exclamation marks.

#### 2.4 Choose a new password (`/reset`)

Reached only from the link in the email.

| State | What the screen shows |
|---|---|
| **Link is good** | One field for the new password, one action, and one sentence stating the rule: at least 8 characters. |
| **Password too short** | The person pressed the action with fewer than 8 characters. A sentence in place, next to the field. |
| **Saving** | A plain line of text, as in 2.2. |
| **Link has run out, or was already used** | No password field. A sentence saying this link no longer works, and one action to ask for a new one, which goes to `/forgot`. The two cases share one message; the person does not need to know which it was. |
| **Could not reach the server** | As in 2.2. The field keeps what they typed. |

Two things for you to decide within your own rules:

- Whether the password field has a way to show what was typed. There is one
  field, not two, so a person cannot catch a typing mistake by entering it
  twice.
- Whether the same control appears on the sign-in and create-account
  password fields, so all three behave alike.

#### 2.5 Back on sign in, after the change (`/in`)

The ordinary sign-in screen with one added line confirming that the password
was changed and that they can sign in with the new one. The line is shown
once, on arrival from 2.4.

### What is not part of this

- No security questions, no code sent by text message, no "confirm your
  current password". A person who knows their current password and wants to
  change it is a separate feature and is not being built now.
- Nothing on the screen ever shows the old or the new password after it is
  saved.

### Open point about routes

`00-flow.md` lists `/restore`, "restore on a new device". With email and
password, getting your journal on a new device is the same as signing in. We
expect `/restore` is no longer needed as a separate screen. This is confirmed
in section 3.

---

## 3. Sign in, create account, first run — ready to draw

### What changed

`00-flow.md` lists `/in`, `/new` and `/restore`, and none of the three was
drawn. It also made the first screen a working application with no account.
An account is now required, so these screens are the front door of the
product, and `08-first-run.html` as drawn is retired.

| Route | What it is now |
|---|---|
| `/` when not signed in | There is no logged-out application. The person is sent to `/in`. |
| `/in` | Sign in. Needs drawing. |
| `/new` | Create an account. Needs drawing. |
| `/restore` | **Removed.** Getting your journal on a new device is signing in. |
| `/forgot`, `/reset` | Section 2. |

This is still not a marketing page. Your rule against a landing page, a
feature grid and badges holds. The first two sentences of the retired first
run screen, *"A private journal. Write it, or say it out loud."*, may be what
a stranger needs to read above the form; that is your call. The third
sentence is about Pro and goes (section 4).

### 3.1 Sign in (`/in`)

An email field, a password field, and one action. A link to create an
account. The forgot-password link from section 2. `00-flow.md` asked for one
field at a time; with a password there are two fields, and whether they share
one screen is your decision.

| State | What the screen shows |
|---|---|
| **Empty** | The form. |
| **Not an email address, or a field left empty** | A sentence in place, next to the field concerned. |
| **Wrong email or wrong password** | **One message for both cases, never two.** It must not say which of the two was wrong, and it must not say whether the address has an account. Both fields keep what was typed. |
| **Signing in** | A plain line of text. |
| **Too many attempts** | A sentence saying to wait a few minutes. |
| **Could not reach the server** | A sentence; the fields keep what was typed. |

The same screen also needs four **arrival lines**. Each is one sentence shown
once, above the ordinary form:

| The person arrives because | The line says |
|---|---|
| They changed their password (section 2.5) | The password was changed; sign in with the new one. |
| They deleted their account (section 7) | The account and everything in it were deleted. |
| They signed out, here or everywhere (section 9) | Nothing is needed, or a quiet "signed out"; your call. |
| Their session ended while they were using the product (section 5) | They were signed out and need to sign in again. Anything they were typing has been kept. |

### 3.2 Create an account (`/new`)

An email field and a password field. No name is asked for anywhere in the
product. One sentence states the password rule: at least 8 characters.

| State | What the screen shows |
|---|---|
| **Empty** | The form, and a link to sign in. |
| **Not an email address** | A sentence in place. |
| **Password too short** | A sentence in place. |
| **That address already has an account** | A sentence saying so, with a way to sign in and a way to reset the password. This is the one place the product does say an address is registered, because there is no other honest answer here. |
| **Creating** | A plain line of text. |
| **Could not reach the server** | A sentence; the fields keep what was typed. |

There is no email confirmation step. A new account is signed in at once.

### 3.3 The first screen of a new account

After creating an account the person lands on Today, signed in, in state 1 of
your states pack: **Empty today**, with its written prompt. That state is
already drawn and is correct. Nothing about it changes. Back from here does
not return to the form.

---

## 4. What each existing screen becomes — ready

**There are no tiers.** This was decided on 2026-10-04. There is no Free and
no Pro. Every person with an account gets the whole product and every feature
in it. Whether the product is later offered as a free trial followed by a
subscription is not decided, and nothing needs drawing for it now.

Three things follow from that.

1. **Every sentence that names Free or Pro goes**, on every screen. Nothing is
   withheld from anyone, so nothing is offered for sale.
2. **The plan page and the upgrade screen are removed**, not paused.
3. **The screens you drew as "Pro" are simply the product.** The note, the
   conversation, the answer, the weekly reflection and transcription are for
   everyone. Your drawings of them stand.

### The order the product is built in

The parts of the product that need a model are built later than the rest.
For a first period the running product has typed entries, recordings kept as
audio, mood, Timeline, keyword search, "keep this out of memory", export and
the account screens, and no model runs. Then transcription, the note, the
conversation, answers and the reflection arrive, for everyone at once.

This does not need a second set of drawings. An entry with no note beneath
it, and a recording with no transcript yet, are ordinary states of the full
product: a new account has no notes, and a recording has no text until it has
been transcribed. State 4 of your states pack already shows the recording
without a transcript. **Please confirm that Today and a past day read
correctly when no note and no transcript are present**, since no screen shows
a whole day in that state.

### Screen by screen

| Screen | What happens to it |
|---|---|
| `01-today` | Stands as drawn. It is no longer "the Pro Today"; it is Today. Built first without the glance line, the notes and the transcript, which arrive later. |
| `02-timeline` | Stays, both zooms. The total line goes (section 10). The "Day One" source mark goes (section 10). |
| `03-talk` | All states stay, including Transcribing. The sentence *"Kept as audio. Pro turns your recordings into text you can read and search."* goes from Listening and from Kept. The "near the fair-use ceiling" state goes; there is no allowance to run out of. |
| `04-ask` | Both the search results and the answer stay, for everyone. The block under the results that names Pro goes. One fact from it may still need saying: a recording that has no text yet is not searched. A plain sentence, if you want it at all. |
| `05-reflection` | Stands as drawn. Built later. |
| `06-conversation` | Stands as drawn. Built later; before then a past day holds entries and recordings only. |
| `07-you` | The Plan row goes. Trackers and Notifications go (section 10). "What the model can see" stays. Privacy, Your data and Account stay. That leaves four rows. |
| `08-first-run` | Retired. Section 3. |
| `09-plan` | **Removed.** |
| `10-settings-privacy` | Privacy stays, rewritten without tiers: the "On free…" and "On Pro…" sentences become one plain account of what is sent, to whom, and for what. "What it sees" becomes one screen, the enumerated version you drew for Pro. Your data: Import goes, and *"free forever, including after you cancel"* becomes a sentence that does not mention cancelling. The "how long it is kept" sentence changes as described in section 6. |
| `11-states` | Stay: 1 Empty today, 2 Day seven (without its total line), 3 Return after three weeks, 4 A recording with no transcript (without its Pro sentence), 5 The note, open, 9 Ask with no matches (without its Pro block), 10 The composer mid-draft. Removed: 6 The crisis card, 7 Offline, 8 Guest and the keep-this panel. |
| `12-upgrade` | **Removed** as an upgrade. Its first state, the progress of transcribing recordings made earlier, may be reused when transcription arrives and existing recordings are turned into text. Nothing is needed now. |

One consequence for state 3, the return after three silent weeks. You drew
the verbatim echo for Free and described a generated line for Pro. With no
tiers there is one behaviour. We will build the verbatim echo first, since it
needs no model. Please say which of the two is the product's final behaviour.

### Guest material removed everywhere

The guest strip on Today, the keep-this panel, the browser-quota warning, the
guest state of Timeline, and the words "to guests" wherever export is
described.

---

## 5. Loading, failure and not-found states — ready to draw

### The general rule we are following

Your rules already decide the shape of every one of these: a sentence in
place, never a disabled control, never a toast, never a spinner or a
skeleton, never colour alone, and no alarm. The product no longer works
offline, so a failed request is now something the person sees, and state 7 of
the states pack, which said there was nothing to retry, no longer applies.

The server's own error messages are written for developers. Every sentence a
person reads will be written for this product, so please supply the wording
or the register for each state below.

### While something is loading

| Where | Needed |
|---|---|
| **Today, Timeline, a day, Ask results, You** | What the screen shows between arriving and having its content. Skeletons and spinners are excluded, so this is presumably a plain line of text, as "thinking" is. Please confirm, and say whether the masthead and destinations are present while it loads. |
| **Timeline, further back** | Timeline loads a stretch at a time and fetches more as the person scrolls back. A line for "fetching earlier entries", and what the foot of the list shows when there is nothing earlier. |

### When something the person did fails

| Action | What must be true | Needs drawing |
|---|---|---|
| **Saving a typed entry** | The text is never lost. It stays in the composer. | A sentence saying it was not saved, with Save still available. |
| **Stopping a recording** | *Back stops and keeps, never discards* still holds. If the upload fails, the recording is held on the page and can be sent again. It is lost only if the person closes the page, and the sentence must say that plainly. | A recording that is kept but not yet saved to the account: how its row looks, the sentence, and the way to send it again. This is the most important state in this section. |
| **Setting or changing mood** | The row shows what is actually saved. | The choice returns to what it was, with a sentence. |
| **Deleting, exporting, signing out a device** | Covered in sections 6 to 9. | |

### When a screen cannot be shown

| Case | Needs drawing |
|---|---|
| **The content could not be fetched** | One sentence and a way to try again, for a destination and for a page. |
| **An address that leads nowhere** | An entry or a day that does not exist. The same screen is shown for something that belongs to another person; the product never confirms that someone else's entry exists. One sentence and a way back to Today. |
| **A day with nothing in it, opened by its address** | An empty day does not exist in your design. Please say whether this is the same screen as the row above. |
| **Something went wrong on our side** | One sentence, no technical detail, no code. |
| **The session ended** | The person was signed out elsewhere, changed their password, or was away too long. They land on sign in with the arrival line in section 3.1. Anything they had typed is kept and is there after they sign in. |

### The composer and spaces

An entry made only of spaces or blank lines is not an entry. We propose that
the composer treats it as empty: the single control stays the record control
and does not become Save. That needs no error state, and it follows from
state 10 of your states pack. Please say if you see it differently.

---

## 6. Deleting one entry or one recording — ready to draw

### What the product will do

A person can delete a single typed entry or a single recording, for example
one added by mistake. No screen in the current set has a control for this, so
the control is new.

1. **There is no undo.** Once deleted, the item cannot be brought back from
   anywhere in the product.
2. **The item disappears at once** from Today, the day page, Timeline and
   search results.
3. **A confirmation before deleting is required.** Your rule that the product
   has exactly one blocking dialog stays true, so this is not a dialog. We
   suggest a confirmation in place: the control is pressed, a
   sentence appears where the item is, saying this cannot be undone, with a
   way to go ahead and a way to keep the item. How this looks is your
   decision.

### What needs drawing

| Piece | Notes |
|---|---|
| **The delete control** | Where it lives is your decision. It is needed for a typed entry and for a recording. It sits with the item's other options (section 11). It must not be reachable by a mis-tap. |
| **Asking first** | The in-place confirmation described above. Keeping the item returns the screen to exactly how it was. |
| **Deleted** | The item is gone. Please decide whether anything is said. |
| **The last item of a day was deleted** | The day no longer has content, and an empty day does not exist. On Timeline the row goes. On the day page, please decide what the person sees. |
| **Could not reach the server** | The delete did not happen. The item stays where it is, with a sentence saying so. |

### One line of existing copy that becomes inaccurate

`10-settings-privacy.html`, under "How long it is kept", says: *"Until you
delete it. Then it is gone, not hidden."* That will not be true of a single
deleted item. It is gone from the product at once and cannot be brought back
by the person, but it is kept in our storage, hidden, until the account
itself is deleted. Deleting the account (section 7) removes everything for
good. Please reword the sentence so that it is exactly true of both cases.

---

## 7. Deleting the account — ready to draw

### What the product will do

"Delete everything" on Your data becomes a deletion of **the account and
everything in it**: every entry, every recording, every mood, and the account
itself. It is immediate and permanent. Items the person deleted earlier,
which were being kept hidden, go at the same moment. Nothing belonging
to anyone else is touched.

The existing dialog is close to right. What changes:

| Piece | Change |
|---|---|
| **The dialog's sentence** | It currently says it "removes 148 entries and 31 recordings from every device". It must also say that the account itself is deleted and that the person will be signed out everywhere. |
| **Export instead** | Stays, and stays the filled button. |
| **Deleting** | A plain line of text while it happens. |
| **Done** | The person is signed out and lands on the sign-in screen with one line saying the account and everything in it were deleted. This state is new. |
| **Could not reach the server** | Nothing was deleted. A sentence saying so, inside the dialog. |

The counts in the dialog and on the Your data row (the "148 and 31") stay.

---

## 8. Export — ready to draw

Export stays as drawn on Your data: one tap, no email step. The person
receives one file to download, containing their entries as markdown, the same
data as JSON, and their recordings as audio files.

The row and its sentence need these states, which are not drawn yet:

| State | What the screen shows |
|---|---|
| **Preparing** | A journal with many recordings takes time to package. A plain line of text saying it is being prepared. |
| **Ready** | The download starts. Please decide whether anything on the screen marks that it did. |
| **Nothing to export** | A new account with no entries. A sentence saying there is nothing to export yet. The control is not disabled. |
| **Could not reach the server** | A sentence saying it did not work, with the action still available. |

The words "free forever, including after you cancel" belong to the tier
model, which no longer exists. That copy is dealt with in section 4.

---

## 9. Devices, and signing out — ready to draw

### What the product will do

A person can see every device and browser that is signed in to their account,
and sign any of them out. They can also sign out of the device in their hand,
which no current screen offers.

The Account row on You currently reads *"Sign in on another device, or change
how you sign in."* It leads to a page that needs drawing.

### The Account page

| Piece | Notes |
|---|---|
| **The email address** | Shown, as on the You row. |
| **Sign out** | Signs out this device only. The person lands on the sign-in screen. |
| **Signed-in devices** | A list. Each row shows the browser and system in plain words, for example "Chrome on Windows", when it was last used, and when it first signed in. The row for the device in hand is marked as this device, in words and not by colour alone. |
| **Sign out, on a row** | Ends that one device's session. The row goes. No dialog. |
| **Sign out everywhere** | Ends every session, including this one. The person lands on the sign-in screen. |
| **Changing the password** | There is no separate change-password form. A person who wants a new password uses the forgot-password flow in section 2, and the page can say so in a sentence. |

### States

| State | What the screen shows |
|---|---|
| **Only this device** | One row. No "sign out everywhere" is needed, or it reads the same as sign out; your call. |
| **Several devices** | The list, newest use first. |
| **A device was just signed out** | The row is gone. Nothing else is said. |
| **Could not reach the server** | A sentence in place; nothing changed. |

---

## 10. Features removed from the designs — ready

These will not be built. Please remove them so the screens do not promise
them.

| Feature | Where it appears today |
|---|---|
| **Import** | The "Bring it in / Import" row on Your data. "Import from another journal" in the Your data sentence on You. "Import third" on first run. The source mark on an imported Timeline row (the "Day One" label on Tue 21 July). |
| **Trackers beyond mood** | The Trackers row on You, the `/you/trackers` page, and the tracker quick-config panel. Mood itself stays exactly as drawn. |
| **Notifications** | The Notifications row on You and the `/you/notifications` page. The product sends no notifications. The only message it ever sends is the password-reset email in section 2. |
| **The Timeline total** | The line "148 entries, 31 recordings, 4h 12m not yet read" in both zoom levels of Timeline, and its day-seven twin in the states pack. Timeline's masthead then has no number in it. The counts on Your data and in the delete dialog are separate and stay. |
| **Offline** | Every offline state, and the "saved on this device" marker. |
| **The crisis card (state 6)** | As in section 1. |

With the Plan row also gone (section 4), You goes from seven rows to four.
Please re-check the screen's rhythm at all three widths.

---

## 11. Editing an entry — ready to draw

### What the product will do

A person can change the text of a typed entry after saving it, for example to
fix a typing mistake. No current screen offers this, so it is new.

1. **Only typed entries can be edited.** A recording cannot be edited; it can
   only be deleted (section 6).
2. **The entry keeps its original time.** Editing does not move it, and the
   product does not mark an entry as edited or show when it was changed.
3. **An entry on a past day can be edited too.** A past day has no composer,
   because the day is over, but what was written on it can still be
   corrected.
4. **An entry cannot be saved empty.** Removing all of the text is not a way
   to delete it.

### An item's own options

An entry now has three things that can be done to it after it is saved:
**edit it**, **keep it out of memory or let it back in**, and **delete it**. A
recording has the last two. They probably belong together in one place, and
where that place is, and how it is reached without being a mis-tap away, is
your decision. `10-settings-privacy.html` already says that being out of
memory can be changed after the fact; this is where that change is made.

### States

| State | What the screen shows |
|---|---|
| **Editing** | The entry's text can be changed, with a way to save and a way to leave it as it was. Whether the text is edited in place in the ruled form or in the composer is your decision. |
| **Saved** | The entry shows its new text at its original time. Nothing else is said. |
| **Left as it was** | The original text is back. No confirmation dialog; the product has exactly one, and this is not it. |
| **All the text was removed** | A sentence saying an entry cannot be empty, and that it can be deleted instead. |
| **Could not reach the server** | The changed text stays on screen and is not lost. A sentence saying it was not saved, with save still available. |

---

## 12. Timezone — ready to draw

### What the product will do

Each person has a timezone, and the product works out their days in it. A day
still ends at 4am, and it is now 4am where the person is.

1. **It is set without asking.** When an account is created, the timezone is
   taken from the person's browser. Nothing is added to the create-account
   screen.
2. **It can be changed in settings**, for someone who moves or travels.
3. **Changing it does not move anything already written.** An entry stays on
   the day it was written on. Only what is written afterwards uses the new
   timezone.

### What needs drawing

| Piece | Notes |
|---|---|
| **Where the setting lives** | Probably the Account page from section 9, as one more row showing the current timezone in plain words, for example "Karachi (UTC+5)". Your decision. |
| **Changing it** | A way to pick a timezone from the full list. The inventory is closed, so please say which existing component carries a long list of choices, or whether this needs a conversation. |
| **The sentence that goes with it** | One sentence saying that a day ends at 4am in this timezone, and that changing it does not move what is already written. |
| **Could not reach the server** | The setting stays as it was, with a sentence. |