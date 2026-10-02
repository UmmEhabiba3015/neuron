# Phase 1 — The Request

**Days 2–7.** The question: *can I store and retrieve a thought?*

> **This entry is late, and the lateness is its own first lesson.** It was due
> on Day 7 and is written on Day 14, reconstructed from the ADRs, the worker
> reports and the git history. Those are a worse source than memory would have
> been a week earlier: they record what was decided and not what it felt like
> to be undecided. Phase 2's entry was written on its own review day, and the
> difference in specificity between the two is visible.

---

## What the phase was for

Day 1 ended with a NestJS application that held journal entries in an array.
Restart it and everything was gone. Six days later the same feature was
durable, validated, configured, and covered by a suite that had found real
defects.

The roadmap's goal for the phase was not the feature: *"one feature, end to
end, that she fully understands."*

---

## The arguments worth keeping

### 1. Type erasure, and why validation cannot be a type

Day 4's load-bearing fact, and the one that makes every later validation
decision obvious instead of arbitrary.

A DTO declared as `{ content: string }` compiles to JavaScript with no trace of
`content` or `string` in it. The type exists for the compiler and is gone at
runtime, so a request body arriving as `{}` satisfies nothing — **there is
nothing left to satisfy.** The server returned a 500 because it then used a
property that was not there.

This was watched rather than explained: the compiled output was read, and the
type was visibly absent.

Everything downstream follows. Validation has to be a runtime check, so it
needs either hand-written code (ADR-005) or a library that keeps metadata at
runtime (ADR-008). The decorators `class-validator` uses are not decoration;
they are how the shape survives compilation at all.

### 2. Status codes are HTTP vocabulary

A repository returning "not found" does not know what an HTTP status is, and
should not. A service deciding business outcomes does not either. Only the
controller speaks HTTP, so only the controller maps an outcome onto a code
(ADR-005).

The general rule, which has held for every layer added since: **each layer
reports outcomes in its own vocabulary, and translation happens where the
vocabulary changes.** The repository says `undefined`; the controller says 404.

### 3. A missing test is usually a missing decision

Day 5's idea, and the most reusable sentence the project has produced.

The suite was green at 39 tests. Three real defects were found inside it, all
by the owner, all confirmed over real HTTP. The one that matters most:
`?word=` — an empty search term — fell through to "return everything", so a
search box answered a request for nothing with the entire journal.

That was not a testing failure. **Nobody had decided what an empty search term
meant**, so there was nothing to write a test against. The test and the
decision arrived together.

The claim has held up. On Day 14, a refactor silently restored that exact
behaviour, and the two tests written on Day 5 caught it nine days later.

### 4. The dangerous configuration bug is the one that starts

Day 6. An application that crashes on a bad configuration value tells you
immediately. An application that *starts* with a bad value — a database path
pointing somewhere harmless, a secret defaulting to a development placeholder —
tells you much later and in a worse way.

So configuration is read once, checked once, and the application refuses to
boot when a value is unusable (ADR-007). Not read where it is needed, not
defaulted quietly.

The same reasoning produced Day 9's `JWT_SECRET` rule: required, minimum 32
characters, and never echoed in an error message.

### 5. A library knows about shapes; it does not know about your product

Day 7, when 91 lines of hand-written parsing became `class-validator`
decorators and a global pipe (ADR-008).

Two rules did not move, and the reason they did not is the point.
`class-validator` can say "this is a string" because that is a fact about
shapes. It cannot say "an entry must contain a character that is not
whitespace", or "a `PATCH` body must contain at least one known field",
because those are facts about this product. Both stayed hand-written, as custom
decorators.

**Reach for a library for the part that is the same in every application, and
write the part that is only true in yours.**

---

## What was got wrong, and what it cost

**Three times in three days, deleting one line disconnected an entire day's
work while every test stayed green.** Day 6's `validate,`, Day 7's `APP_PIPE`
provider, Day 8's `synchronize: false`. Each was found by mutation during an
audit rather than by a test, and each now has one.

That is where the project's standing rule came from: **a test that does not
fail when the wiring is removed has not been written.** Every day since has
included a mutation check, and Day 14's sweep is that rule applied across a
whole phase.

**Two experiments from this phase are still worth repeating**, because both
contradict intuition:

1. Rename `@Controller('entries')` to `'journal'`. Every client gets a 404 and
   **all unit tests still pass.** Unit tests verify that pieces work; e2e
   verifies that they are connected.
2. Delete `EntriesRepository` from the module's `providers`. Typecheck passes,
   build passes, the server crashes at boot, **and the unit tests still pass** —
   because every spec declares its own providers and never reads the module.

---

## What Phase 2 inherited

A NestJS API in a pnpm workspace storing entries in SQLite. Data access behind
a repository. Input validated at the boundary by a global pipe. Configuration
checked at boot. 108 unit tests and 35 e2e, all passing. Seven ADRs.

**And the thing that defined Phase 2's first two days:** no identity of any
kind. `GET /entries` returned every entry to anybody, and ADR-004's
hand-written SQL was about to meet a schema change it could not make safely,
which is how Day 8 ended up adopting an ORM and migrations instead of doing
what the plan said.
