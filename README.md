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

## Data

Entries are stored in a SQLite database — a single file at
`apps/api/data/neuron.db`, created automatically on first run. Set
`DATABASE_PATH` to put it somewhere else (relative paths resolve from the
directory the API is started in):

```bash
DATABASE_PATH=./data/scratch.db pnpm dev
```

The file is gitignored and holds nothing but local state, so deleting it resets
the API to empty:

```bash
rm apps/api/data/neuron.db
```

Tests never touch it — they run against an in-memory database. See
[ADR-003](docs/decisions/ADR-003-sqlite.md) for why SQLite, and why it is
expected to be replaced later.

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
  roadmap.md        the 30-day build plan
```

There is no `packages/` directory yet — it's intentionally deferred until
the API and web app both exist and actually need to share code. See
[ADR-001](docs/decisions/ADR-001-monorepo.md) for why.
