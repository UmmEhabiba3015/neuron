# ADR-005: Put HTTP Status Codes in the Controller, and Validate by Hand

**Status:** Accepted
**Date:** 2026-08-01 (Day 4)

---

## Decision

HTTP status codes live in `EntriesController` and nowhere else. Neither
`EntriesService` nor `EntriesRepository` may throw an HTTP exception. Request
validation is written by hand in the controller — no `class-validator`, no
`zod`, no `ValidationPipe`.

---

## Problem

Three endpoints returned a status code that was wrong, and all three were wrong
in the same direction: a 500, which tells a client "this server is broken",
where the truth was "your request was malformed" or "that thing does not exist".

```
POST /entries  {}                 →  500   should be 400
GET  /entries/does-not-exist      →  500   should be 404
GET  /entries?word=zzzzz          →  500   should be 200 []
```

The first two came from `EntriesRepository` throwing a plain `Error`, which Nest
has no choice but to render as 500 — it is an unrecognised exception, so the
framework assumes the server failed. The third came from treating "the search
matched nothing" as a failure at all.

There was also a fourth problem, which produced no error and was therefore the
easiest to miss. `POST /entries` accepted any body whatsoever:

```
POST /entries  {"content": 42}    →  201 Created   {"content": 42}
GET  /entries/<that id>           →  200 OK        {"content": "42"}
```

The same entry, two different types, depending on which endpoint served it. The
cause is that a SQLite `TEXT` column has type *affinity*, not a type
*constraint*: handed the number `42`, it stores the string `"42"` without
complaint. The POST response echoed the in-memory object it had just built; every
subsequent GET returned what the database actually held. Nothing errored,
nothing logged, nothing warned.

Note that all four of these passed `pnpm lint`, `pnpm typecheck`, `pnpm build`
and `pnpm test`. This is the same failure class as the Day 3 `ORDER BY` bug: a
rule that exists in someone's head, written down nowhere, and therefore checked
by nothing.

---

## Decision 1: status codes belong to the controller

### The rule

- The **repository** may not know that HTTP exists. It reports storage outcomes
  in storage vocabulary. (This is ADR-004, restated.)
- The **service** may not throw HTTP exceptions either. This extends ADR-004's
  boundary rule *upward*, and is new today.
- The **controller** translates. A status code is HTTP vocabulary, so
  `NotFoundException`, `BadRequestException` and every other HTTP concern live
  here and only here.

### Reasoning

The argument for keeping HTTP out of the repository was made in ADR-004. The
argument for keeping it out of the *service* is the same argument applied one
layer up, and it is worth stating plainly because the service is where the
temptation is strongest — `findById` knows the entry is missing, and throwing
`NotFoundException` right there is one line shorter.

The reason not to: **a `NotFoundException` is an instruction to write an HTTP
response.** It carries a status code, and a status code is only meaningful to
something that is going to serialise it into a response. The service has to stay
callable from places where no such thing exists:

- a background job that summarises entries (Day 18 on the roadmap),
- a seeding or import script,
- a unit test.

A caller with no HTTP response to write cannot do anything sensible with a 404.
It would have to catch a web-framework exception and translate it back into
"the entry was absent" — which is the information the service had in the first
place and threw away.

The rule generalises: **each layer reports outcomes in its own vocabulary, and
translation happens at the boundary where the vocabulary changes.** "No such
row" is storage vocabulary. "`undefined`" is application vocabulary. "404" is
HTTP vocabulary. Only the controller sits on the HTTP boundary, so only the
controller may speak that third language.

---

## Decision 2: `undefined` for `findById`, `[]` for `findByContent`

These two look inconsistent — one missing thing returns `undefined`, another
returns an empty collection — and the asymmetry is deliberate.

**`findById` returns `undefined` because a single missing thing has no
representation.** There is no such value as "an empty entry". `undefined` is the
only honest answer to "give me the entry with this id" when there isn't one.
Whether that absence is an error depends entirely on who is asking: for
`GET /entries/:id` it is a 404, but for a job checking whether an entry still
exists before processing it, absence is the expected case and not exceptional at
all. The service cannot know which caller it has, so it reports the fact and
declines to interpret it.

**`findByContent` returns `[]` because a collection query always has an answer.**
"Which entries contain the word zzzzz" has a complete, correct, useful answer
when nothing matches: none of them. The empty list *is* that answer. Treating it
as an error confuses "the question had no results" with "the question could not
be answered", and it forces every caller to wrap a search in a `try`/`catch` to
handle the most ordinary outcome a search has.

This fix required *deleting* code rather than adding it. `records.map(...)` over
an empty array already produces `[]`; the only thing standing between the old
behaviour and the correct one was a `throw`.

---

## Decision 3: validation is hand-written

### What is checked

A request body to `POST /entries` is valid only if `content` is present, is a
string, and contains at least one non-whitespace character. Three checks, none
redundant:

| Body | Fails | Why it matters |
|---|---|---|
| `{}` | present | Nothing to store. |
| `{"content": 42}` | is a string | SQLite's TEXT affinity silently coerces it; POST and GET then disagree about the type. |
| `{"content": ""}`, `{"content": "   "}` | non-whitespace | An entry with no readable text can never be displayed, searched, or summarised. |

Content is stored **verbatim**. Whitespace is used to *decide validity*, never to
*modify the value*. `"  padded text  "` is valid and is stored with its spaces
intact — trimming would silently rewrite what the user wrote, and the API has no
business editing a journal entry's text.

### Alternatives considered

**(a) Hand-written checks in the controller.** *(chosen)*

**(b) `class-validator` + `class-transformer` with Nest's `ValidationPipe`.** The
DTO becomes a class with decorators (`@IsString()`, `@IsNotEmpty()`), and a
global pipe enforces them on every endpoint automatically.

**(c) `zod`.** Declare a schema as a value; parse the body against it. The
validated TypeScript type is inferred from the schema, so the type and the
runtime check cannot drift apart.

### Pros

- **(a)** Zero dependencies. Nothing new to learn. The check is ordinary
  TypeScript, readable by anyone, and each rejection can carry a message written
  for that specific failure.
- **(b)** Declarative and hard to forget once the global pipe is registered — a
  new endpoint is validated by default. It is also the idiomatic NestJS answer,
  which matters for a codebase other people will read.
- **(c)** One schema is simultaneously the runtime check *and* the source of the
  static type, which structurally eliminates the "type says string, runtime got a
  number" class of bug. Composable and framework-independent.

### Cons

- **(a)** Manual, and therefore forgettable. Nothing forces a future endpoint to
  validate anything; a missing check is silent. Repeated rules will eventually be
  duplicated and will drift.
- **(b)** Two dependencies, plus decorator metadata — a mechanism that is already
  the least transparent part of this codebase. It also pulls DTOs from interfaces
  into classes, because decorators need a runtime object to attach to.
- **(c)** A dependency and a new mental model. Its main strength, inferring
  complex types from complex schemas, has one field to work on.

### Reasoning

Options (b) and (c) are both genuinely better than (a) *at scale*, and both are
rejected on **timing, not merit** — the same reasoning ADR-004 used to defer the
query builder and the ORM.

The scale in question today is: **one endpoint, one field, three checks.** The
entire hand-written validator is about fifteen lines. Against that, (b) costs two
dependencies and moves the DTO from an interface to a decorated class; (c) costs
one dependency and a new API. Neither buys anything today that fifteen lines of
`if` statements do not already provide.

There is also a learning argument, and it is the same one ADR-004 made about SQL.
Writing the check by hand makes it obvious *what* is being checked and *why each
check exists* — particularly the string check, whose necessity comes from SQLite's
type affinity and would have been completely hidden behind an `@IsString()`
decorator. Knowing why validation is needed transfers to every language and
framework. Knowing `class-validator`'s decorator names does not.

---

## Decision 4: `/entries/count` returns an object

`GET /entries/count` returned a bare `5`. It now returns `{ "count": 5 }`. The
status code is unchanged; only the body shape moved.

Two reasons, in order of weight:

1. **Consistency is a property the API either has or does not have.** Every other
   endpoint on this surface returns an object, or an array of objects. A bare
   number was the single exception, and exceptions are what clients get wrong.

2. **A bare number cannot change.** An object can gain a field later — say
   `{ "count": 5, "oldestAt": "..." }` — without breaking a client that already
   reads `count`. A bare `5` has nowhere to put a second value, so *any* future
   addition is a breaking change for every existing consumer.

The wrapper is built in the controller, not the service. `countEntries()` returns
a `number`, because "how many entries exist" is a quantity in application terms.
That the HTTP response wraps it in an object is a fact about this API's response
shape, which makes it an HTTP concern and puts it on the controller's side of the
boundary drawn in Decision 1.

---

## Accepted cost: `CreateEntryDto` enforces nothing

`CreateEntryDto` replaces the inline `@Body() body: { content: string }`. The
inline type was actively false: it named `content` correctly, but it was a
structural echo of `JournalEntry`, which also carries `id` and `createdAt` —
neither of which a client may send. A DTO ("Data Transfer Object") describes data
*crossing a boundary*, as distinct from `JournalEntry`, which describes what an
entry *is* inside the application.

**The DTO is erased at compile time and validates nothing at runtime.** This is
worth stating explicitly, because a named type on a request body creates a
powerful illusion of safety. TypeScript is not present when the request arrives;
the body is whatever the network delivered. The type is documentation.

The hand-written check is what actually upholds the contract. To keep the two
from being confused, the controller method takes `@Body() body: unknown` rather
than `@Body() body: CreateEntryDto` — `unknown` is the honest type for
un-inspected input, and it makes the compiler *require* the validation step
before the value can be used at all. The `CreateEntryDto` type is what the
validator returns, so the name marks data that has been checked rather than data
that was merely hoped for.

---

## Future Revisit Conditions

- **When the same validation check is duplicated across enough endpoints that
  forgetting one becomes likely.** This is the concrete trigger for adopting (b)
  or (c). The failure mode to watch for is specific: **a forgotten check is
  silent.** Lint, typecheck, build and tests all pass while the endpoint quietly
  accepts bad data. That is exactly how the Day 3 `ORDER BY` bug shipped, and
  exactly the risk the `created_at` cast carries in ADR-004. The moment
  validation depends on a human remembering, rather than on a mechanism, the
  dependency has earned its cost.
- **Day 5 (update and delete)** — `PATCH`/`PUT` bodies are the first real test of
  this decision. A partial update has different rules than a create (fields are
  optional but must still be valid when present), and hand-writing that second
  set of rules is where duplication starts.
- **When a validation rule needs to be shared with the frontend.** `zod` schemas
  can be exported from a shared package and used on both sides; hand-written
  checks in a controller cannot. If the web app starts duplicating these rules in
  its own form validation, option (c) gains an argument it does not have today.
- **If an error response ever needs a machine-readable shape** — a stable error
  code, or per-field errors for form display. The current responses carry a human
  message and a status code, which is sufficient for one field and would not be
  for a form with ten.
