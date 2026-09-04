# Neuron

Neuron is a journaling API being built as a learning project in backend
architecture. It's structured as a pnpm workspace so the API (and, later,
a web client) can share tooling and stay in one coordinated history. Right
now it consists of a single NestJS API that reads and writes journal entries
to a local SQLite database — everything from here (auth, search) is built up
incrementally; see [docs/roadmap.md](docs/roadmap.md) for the plan.

## Prerequisites

- Node.js >= 24 (persistence uses the built-in `node:sqlite` module, which is
  only stable — and available without a flag — from Node 24)
- pnpm 11.17.0 (pinned via `packageManager` in [package.json](package.json);
  run through [Corepack](https://nodejs.org/api/corepack.html) if you don't
  have it installed globally)

## Install

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

This starts the API in watch mode on `http://localhost:3000`. Try:

```bash
curl http://localhost:3000/entries
```

## Configuration

The API reads exactly two environment variables. Both are optional, and both
are checked once when the application starts — a value that is set but unusable
stops the boot with a message naming the variable and quoting the value, rather
than being quietly corrected.

| Variable        | Default                  | Rule                                                                                                |
| --------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `PORT`          | `3000`                   | A whole number from 1 to 65535. Empty, `0`, negative, above the range, text, or a number with stray spaces around it all refuse to boot. |
| `DATABASE_PATH` | `apps/api/data/neuron.db` | Any non-empty path; empty refuses to boot. A relative path resolves from the directory the API was started in. If the file does not exist, the API warns and creates an empty one. |

Copy [.env.example](.env.example) to `.env` to set them locally. `.env` is
gitignored and is loaded by Node itself (`--env-file-if-exists`), so there is no
`dotenv` dependency and a fresh clone with no `.env` starts fine. A real
environment variable always wins over a value in the file:

```bash
PORT=4242 pnpm dev
```

See [ADR-007](docs/decisions/ADR-007-configuration-and-boot-validation.md) for
why these are checked at boot rather than at first use.

## Data

Entries are stored in a SQLite database — a single file at
`apps/api/data/neuron.db`. The **file** is created automatically on first run,
but the **tables are not**: the schema comes from migrations, and the API never
applies them itself. Run them once before you start it:

```bash
pnpm migration:run
```

Skip that and the API starts perfectly happily, reports
`Nest application successfully started`, and then fails every request with
`no such table: entries`. That is deliberate — see *Migrations* below.

Set `DATABASE_PATH` to put the file somewhere else:

```bash
DATABASE_PATH=./data/scratch.db pnpm dev
```

Because a mistyped path is still a perfectly valid path, the API cannot tell
`data/nueron.db` from `data/neuron.db` by looking at it. What it can do is
notice that no database is there and say so, which is why pointing
`DATABASE_PATH` at a file that does not exist prints a warning before creating
it. No warning is printed for the default path, where a missing database just
means this is the first run.

The file is gitignored and holds nothing but local state, so deleting it resets
the API to empty:

```bash
rm apps/api/data/neuron.db
```

Tests never touch it — they run against a throwaway database of their own. See
[ADR-003](docs/decisions/ADR-003-sqlite.md) for why SQLite, and
[ADR-010](docs/decisions/ADR-010-typeorm.md) for why the driver is now TypeORM
with `better-sqlite3`.

## Migrations

Every schema change is a migration. Nothing changes the schema at boot — TypeORM's
`synchronize` is `false` and there is a test that fails if anyone turns it on,
because schema-on-boot is what this project replaced and it would silently rewrite
tables rather than merely skipping a check.

```bash
pnpm migration:run       # apply everything pending
pnpm migration:revert    # undo the most recent one
pnpm migration:generate apps/api/src/database/migrations/<Name>
```

`migration:generate` compares the entity classes against the database and writes
the SQL for you. **Read what it produces before trusting it.** SQLite cannot add a
foreign key to an existing table, so TypeORM rebuilds the whole table — creating a
temporary copy, moving every row, dropping the original and renaming. That is
correct, and it is not what the word "generate" suggests.

### A database created before migrations existed

If your database was made before Day 8 it has no `migrations` table, so TypeORM
believes nothing has ever been applied, tries to run the initial migration, and
stops:

```
Migration "InitialSchema1788262448946" failed, error: table "entries" already exists
```

Nothing is lost — the whole thing runs in a transaction and rolls back — but no
migration is applied either. The database already *has* that initial schema; it
simply has no record of it. So tell it, once:

Run this **from `apps/api`**, not from the repository root:

```bash
cd apps/api
node -e "
  const Database = require('better-sqlite3');
  const db = new Database('data/neuron.db');
  db.exec('CREATE TABLE IF NOT EXISTS migrations (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, timestamp bigint NOT NULL, name varchar NOT NULL)');
  db.prepare('INSERT INTO migrations (timestamp, name) VALUES (?, ?)')
    .run(1788262448946, 'InitialSchema1788262448946');
"
pnpm migration:run
```

Two details that are easy to get wrong, and both were got wrong while writing
this. There is deliberately no `sqlite3` command here: that CLI is a separate
package this project does not require and which is not installed. And the
directory matters — `better-sqlite3` lives in `apps/api`'s dependency tree, so the
same command run from the repository root fails with `Cannot find module`.

This is called baselining. It is needed once per database that predates
migrations, and never for one created from scratch by `pnpm migration:run`.

Other root-level scripts:

```bash
pnpm build      # compile the API
pnpm lint       # lint the API (auto-fixes what it can)
pnpm typecheck  # typecheck everything, including test files
pnpm test       # run the API's unit tests
pnpm test:e2e   # run the API's end-to-end tests
```

## Repo layout

```
apps/
  api/    NestJS API (the only app so far)
docs/
  decisions/        Architecture Decision Records (ADRs)
  learning/         day-by-day learning notes and worker reports
  workers/          task briefs handed to worker sessions
  constitution.md   the engineering principles this project is built under
  master-state.md   where the project currently stands
  roadmap.md        the 40-day build plan
  SETUP.md          how to continue this project on another machine
```

There is no `packages/` directory yet — it's intentionally deferred until
the API and web app both exist and actually need to share code. See
[ADR-001](docs/decisions/ADR-001-monorepo.md) for why.
