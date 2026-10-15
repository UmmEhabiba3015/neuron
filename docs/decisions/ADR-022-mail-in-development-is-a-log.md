# ADR-022: Mail in Development Is Written to the Log

**Status:** Accepted
**Date:** 2026-10-15 (feature 2, Forgot password)

---

## Context

A person who has forgotten their password cannot sign in, so the app cannot
ask them anything inside the app. It can prove only one thing about them:
that they control the inbox of the account's email. So the server sends a
link to that address, and whoever opens it may choose a new password
(`features.md`, Ref 4). This is the first time Neuron sends anything outside
itself.

Neuron runs only on her laptop until feature 8, Going live. There is no
domain, and nobody but her uses it. Real mail providers expect a domain the
sender owns, and without one the large inboxes put the mail in spam or
refuse it.

---

## Decision

The API sends mail through a small `MailService`. The rest of the API asks
it to send one email and does not know how it is sent.

Until feature 8 there is one kind of `MailService`, and it **writes the
whole email, link included, to the API's log**. She copies the link from the
terminal where `pnpm dev` runs.

Her choice, 2026-10-15.

---

## Alternatives

| Option | For | Against |
|---|---|---|
| **The log** (chosen) | No new program and no new library. The flow can be tested end to end today | Real sending is not exercised until feature 8 |
| **Mailpit**, a local program that receives mail over SMTP and shows it in a web page | The sending code is real; later it may need only another server address | A program to install and keep running, and a mail library (`nodemailer`) in the API, for a problem that does not exist yet |
| **A real provider now** | Real email in a real inbox | Needs a domain and DNS records Neuron does not have; the choice of provider belongs with the hosting choice in feature 8 |

Mailpit was her first answer and is sound; many teams use it. The log won
under Rule Zero: it does the same job here with nothing added.

---

## Accepted costs

- **A reset link in a log is a working key to an account.** Anyone who can
  read the log can take over the account until the link is used or expires.
  On her laptop she is the only reader. On a real server it would be a
  serious leak.
- **Nothing stops the log mailer in production yet**, because Neuron has no
  production yet: the configuration has no idea of where it runs. Adding
  that now would answer an imaginary problem. It is owed to feature 8, and
  recorded in `master-state.md` as known debt.

---

## Revisit when

- **Feature 8, Going live.** Choose a real provider, add its `MailService`,
  and make the configuration check at start (ADR-007) refuse to start a
  production server with the log mailer.
- Anyone but her runs the API, before feature 8.
