# ADR-018: Where the Browser Keeps the Credential, and CORS

**Status:** Accepted
**Date:** 2026-10-05 (Day 15)

**Amends:** ADR-014, which returned the refresh token in the response body and
read it from the request body. For the web client it now travels in a cookie.
Everything else in ADR-014 stands: rotation, reuse detection, and the session
check on every request.

---

## Context

Phase 3 puts a browser in front of the API. Two things have to be settled
before a single screen can log in.

- **The browser must keep something that keeps the user signed in.** ADR-014
  gave the API a 15-minute access token and a 30-day refresh token. The
  refresh token is the valuable one, and it has to live somewhere between
  page loads.
- **The browser cannot call the API at all today.** The web app is served from
  `http://localhost:3001` and the API from `http://localhost:3000`. Those are
  two origins, and the API sends no CORS headers.

A native mobile app was part of this question for a while, because a native
client cannot use a browser cookie. It was ruled out of scope on 2026-10-04,
so this ADR is about the web client only.

---

## Decision

**The refresh credential lives in an `HttpOnly` cookie. The access token lives
in JavaScript memory and nowhere else.**

1. **Login and refresh set a cookie** holding the session id and the refresh
   token. Its attributes are `HttpOnly`, `SameSite=Strict`,
   `Path=/auth/refresh`, and a lifetime equal to the refresh token's.
2. **The refresh token is no longer in any response body.** A value in the
   body is a value JavaScript can read, which would undo the point of
   `HttpOnly`.
3. **`/auth/refresh` reads the cookie** and takes no body.
4. **Logout clears the cookie** as well as revoking the session.
5. **The access token is returned in the body and kept in memory.** It is not
   written to `localStorage` or `sessionStorage`. After a page reload the app
   calls `/auth/refresh` once to get a new one.
6. **CORS allows exactly one origin, the web app's, with credentials.** The
   origin is a configuration value, `WEB_ORIGIN`, checked at boot under
   ADR-007, and is not written in `main.ts`.

---

## The reasoning, which is the owner's

She worked through the threat model before choosing. Two findings decided it.

**Reuse detection does not rescue `localStorage`.** ADR-014 revokes every
session when an old refresh token is replayed. That only fires when the real
client and the thief both use the token. A patient attacker waits until the
user has stopped using that device, and then nothing stale is ever presented.
*"Reuse detection catches a careless thief. A patient one gets through."*

**`HttpOnly` limits the attack; it does not prevent it.** An attacker who can
run JavaScript on the page can still call `/auth/refresh`, because the browser
attaches the cookie for them. What they cannot do is read the credential and
carry it away. *"HttpOnly doesn't prevent XSS. It bounds XSS in time and
place."*

Her statement of the decision: an XSS attacker should not be able to extract
the long-lived refresh credential and take it elsewhere. Even if the session
can be abused while the page is open, the refresh token stays confined to the
browser and the device, and does not become a portable 30-day credential.

---

## What CORS is, and what it is not

Established by prediction on the day, all three parts at the first attempt:

- A cross-origin request **does reach the API**, and the API answers it.
- The browser **refuses to show the answer to the page's JavaScript** unless
  the API's headers allow that origin.
- `curl` is unaffected, because CORS is enforced by browsers and by nothing
  else.

So CORS protects **responses from being read** by another origin. It does not
stop requests from being **sent**. It is not an access control on the API.

A page on any other origin still receives an `Access-Control-Allow-Origin`
header. It names the web origin and not the asking page, so the browser
compares the two, finds they differ, and withholds the response.

---

## The cost of the cookie: CSRF

A cookie is attached automatically. A page on another site can therefore make
the user's browser send a request to `/auth/refresh` with the cookie on it.
The attacker cannot read the answer, but the server acted. This is cross-site
request forgery, and `localStorage` does not have the problem.

**`SameSite=Strict` is the defence.** The browser attaches the cookie only
when the request comes from a page on the same site, so the forged request
arrives anonymous. `Strict` was chosen over `Lax` because this cookie is only
ever used by the app's own page; nothing needs it to survive a link from
elsewhere.

The routes that change journal data were never exposed to this. They need the
access token in an `Authorization` header, and another site cannot set that
header.

---

## Alternatives rejected

**`localStorage` for the refresh token.** The simplest option, and the API
already supported it without change. Rejected because any script on the page
can read it and send it elsewhere, where it works for thirty days.

**`sessionStorage`.** Readable by script in exactly the same way, and it also
signs the user out when the tab closes. The weakness of one and the
inconvenience of the other.

**`origin: '*'`.** Rejected because only the project's own frontend should
read API responses. Browsers also refuse a wildcard origin on a request that
carries credentials, so it would not have worked.

---

## Accepted costs

- **The API changes.** Login and refresh set a cookie, refresh reads one, and
  the end-to-end tests that send a refresh token in the body are rewritten.
- **A page reload costs one extra request**, the refresh that replaces the
  access token lost from memory.
- **CSRF is now a thing this project has to think about**, on every future
  route that authenticates by cookie alone. Today that is one route.
- **The API and the web app must be on the same site in production** for
  `SameSite=Strict` to work. On a laptop they are, because a site ignores the
  port. For the same reason, anything else running on `localhost` is same-site
  with this API. That is true of local development only.
- **Logging out after the access token has expired costs one extra request.**
  Logout needs an access token, and the cookie is sent only to
  `/auth/refresh`, so the web app refreshes first and then logs out.
- **The cookie can outlive its session.** A session's expiry is fixed at
  login. The cookie's lifetime restarts on every refresh. In the gap the
  server answers 401, so nothing is exposed, and the mismatch is accepted
  rather than made exact.
- **`WEB_ORIGIN` must be written exactly as a browser sends it**: lower case,
  and without a scheme's default port. Anything else is refused at boot,
  because it would start and then match nothing.

---

## The web origin has no default

**When `WEB_ORIGIN` is absent, the API refuses to start.** The owner's
decision, and her reason: the web origin is an intentional security boundary
and not a convenience setting. A silent default could allow the wrong origin
in another environment, whereas refusing forces each deployment to declare the
frontend it trusts.

This puts `WEB_ORIGIN` beside `JWT_SECRET` in ADR-007's terms, and not beside
`PORT`. The cost is one more required line in every developer's `.env`, and
`.env.example` carries it.

---

## Revisit when

- **A native client is built.** It cannot use a browser cookie, so
  `/auth/refresh` will need a body path again. That is a later project.
- **Day 31, deployment.** The cookie gains `Secure` once HTTPS exists, and the
  same-site requirement above becomes a real constraint on the domain names.
- **A second route authenticates by cookie alone.** `SameSite` covers it, but
  that is the moment to check rather than assume.
