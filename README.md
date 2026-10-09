# Neuron

Neuron is a private journal on the web. A person writes short entries through
the day, says how the day felt, and looks back over past days. Later phases
add search and a way to ask questions of your own journal.

It is also a deliberate learning project, built in public over 40 days, whose
main subject is backend architecture. Every decision is recorded with its
reasons in [docs/decisions/](docs/decisions/). The plan is
[docs/roadmap.md](docs/roadmap.md), and what the product must do is
[docs/requirements.md](docs/requirements.md).

## What works today

- Create an account (email, password, name; the timezone is taken from the
  browser), sign in, stay signed in across a reload, and sign out.
- Write an entry and delete one. Set the mood of today or of a past day.
- The Timeline: every day with entries, newest first, and a month calendar.
  A past day has its own page.

**Every screen of the final design is drawn**, including those whose features
are not built yet. Pressing a control whose feature is not built says "This is
not built yet." and sends nothing. The full list, with the day each one is
wired, is [apps/web/lib/unbuilt.ts](apps/web/lib/unbuilt.ts).

## The parts

```
apps/
  api/          NestJS API on SQLite, through TypeORM
  web/          Next.js web app
packages/
  contracts/    what crosses between the two apps, stated once
designs/        the designer's screens (information, not instructions)
docs/
  requirements.md   what the product must do
  roadmap.md        the 40-day plan, and where it stands
  decisions/        Architecture Decision Records (ADRs)
  handbook/         the reasoning across decisions, one entry per phase
  learning/         worker reports and learning records, by day
  master-state.md   where the project stands, for restarting the mentor session
  SETUP.md          how to set the project up on a new machine
  HANDOFF.md        the project explained to a reader who has not followed it
```

`packages/contracts` holds the facts both apps must agree on: the shapes that
travel over HTTP, the mood words, the page sizes and the password minimum. It
imports nothing and has no build step. See
[ADR-019](docs/decisions/ADR-019-shared-contracts-package.md).

## Setting it up

You need Node.js 24 or newer and pnpm 11.17.0 (`corepack enable` provides it).
Node 24 is needed because both apps load TypeScript files from
`packages/contracts` directly. [docs/SETUP.md](docs/SETUP.md) has the full
steps, including moving an existing journal to a new machine.

```bash
pnpm install
cp .env.example .env                           # then set JWT_SECRET; see below
cp apps/web/.env.example apps/web/.env.local
pnpm migration:run                             # creates the tables
pnpm dev                                       # the API, http://localhost:3000
pnpm dev:web                                   # the web app, http://localhost:3001
```

## Configuration

The API reads four environment variables, checked once when it starts. A value
that is set but unusable stops the start with a message naming the variable,
rather than being quietly corrected
([ADR-007](docs/decisions/ADR-007-configuration-and-boot-validation.md)).

| Variable | Default | Rule |
|---|---|---|
| `PORT` | `3000` | A whole number from 1 to 65535 |
| `DATABASE_PATH` | `apps/api/data/neuron.db` | Any non-empty path. A file that does not exist is created, with a warning |
| `JWT_SECRET` | **none, required** | At least 32 characters. It signs every access token, so a default would let anyone who reads this repository forge one |
| `WEB_ORIGIN` | **none, required** | The one origin allowed to call the API from a browser, for example `http://localhost:3001`. No path, no trailing slash |

Generate a secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

`.env` is gitignored and is loaded by Node itself, so there is no `dotenv`
dependency. A real environment variable always wins over the file.

The web app has one setting, `NEXT_PUBLIC_API_URL`, the address of the API as
the browser calls it. It is required, and it is written into the JavaScript at
build time, so changing it needs a new build.

## The API

Every route requires a signed-in user unless it is marked public. A route
added later is closed by default
([ADR-013](docs/decisions/ADR-013-ownership-enforcement.md)).

| Method | Route | Public | What it does |
|---|---|---|---|
| `POST` | `/auth/register` | yes | Creates an account from `email`, `password`, `name` and `timezone` (an IANA name such as `Asia/Karachi`). `409` if the email is taken |
| `POST` | `/auth/login` | yes | `200` with `{ accessToken, user }`, and the refresh credential in an `HttpOnly` cookie. `401` for any failure |
| `POST` | `/auth/refresh` | yes | Reads the refresh cookie. `200` with a new access token and a rotated cookie, or `401` |
| `POST` | `/auth/logout` | | Ends this session. `204` |
| `POST` | `/auth/logout-everywhere` | | Ends every session of the caller. `204` |
| `GET` | `/auth/sessions` | | The caller's active sessions |
| `GET` | `/auth/me` | | The caller |
| `GET` | `/entries` | | The caller's entries, newest first. `?word=` searches, `?date=YYYY-MM-DD` narrows to one day, `?limit=` and `?offset=` page. Each entry carries its day's `date` |
| `POST` | `/entries` | | Writes an entry. The API decides its time and its day |
| `GET` | `/entries/count` | | `{ count }`, with the same filters as the listing |
| `GET` | `/entries/:id` | | One entry, or `404` |
| `PATCH` | `/entries/:id` | | Changes an entry's text, or `404` |
| `DELETE` | `/entries/:id` | | Deletes an entry (a soft delete). `204`, or `404` |
| `GET` | `/days?from=&to=` | | The days in a range that have at least one entry |
| `GET` | `/days/today` | | Today's date and mood, in the caller's timezone |
| `GET` | `/days/:date` | | One day's mood. A day that has not happened yet is a `404` |
| `PUT` | `/days/:date/mood` | | Sets or clears a day's mood |

The rules behind these answers:

- **A day ends at midnight in the person's own timezone**, which the browser
  supplies at registration. The API, not the browser, decides which day an
  entry belongs to, and an entry never moves once filed
  ([ADR-015](docs/decisions/ADR-015-the-day-is-the-aggregate.md)).
- **Each person sees only their own data.** Every query is limited to the
  owner in its `WHERE` clause. Asking for someone else's entry is a `404`,
  never a `403`, so "not yours" and "does not exist" look the same.
- **Login never says which half was wrong**, and an unknown email costs the
  same hashing time as a wrong password
  ([ADR-012](docs/decisions/ADR-012-authentication-endpoints.md)).
- **Access tokens last 15 minutes and live in the page's memory. Refresh
  tokens last 30 days, rotate on every use, and live in a cookie scripts
  cannot read.** Signing out takes effect on the very next request, and
  reusing an old refresh token ends every session of that user
  ([ADR-014](docs/decisions/ADR-014-sessions-and-revocation.md),
  [ADR-018](docs/decisions/ADR-018-browser-credential-and-cors.md)).
- **Passwords are stored as argon2id hashes**
  ([ADR-011](docs/decisions/ADR-011-password-storage.md)).

## The database and migrations

The journal is a SQLite file, `apps/api/data/neuron.db`, gitignored. The API
creates the file but **never creates or changes tables itself**: every schema
change is a migration, and a test fails if TypeORM's `synchronize` is turned
on ([ADR-010](docs/decisions/ADR-010-typeorm.md)).

```bash
pnpm migration:run        # apply everything pending; run it whenever new ones arrive
pnpm migration:revert     # undo the most recent one
pnpm migration:generate apps/api/src/database/migrations/<Name>
```

Read a generated migration before trusting it. SQLite cannot add a constraint
to an existing table, so TypeORM rebuilds the whole table, and twice a
generated migration has copied a `NOT NULL` column without a value. Several of
this project's migrations are hand-written for that reason.

A database made before Day 8 has no `migrations` table and needs a one-time
repair before migrations will run; [docs/SETUP.md](docs/SETUP.md) has it.

## Checks

Nine commands. The first five cover the API, the last four the web app, and
both test commands also run the shared package's checks. Every audit runs all
nine; use exactly these, because a shorter form can skip tests and still
report a pass.

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
```

At the close of Screens Day: 246 API unit tests, 365 API end-to-end tests,
171 web tests and 7 checks on the shared package, all passing.
