# Neuron

Neuron is a journaling API being built as a learning project in backend
architecture. It's structured as a pnpm workspace so the API (and, later,
a web client) can share tooling and stay in one coordinated history. Right
now it consists of a single NestJS API with one endpoint that returns a
hardcoded list of journal entries — everything from here (persistence,
auth, search) is built up incrementally; see [docs/roadmap.md](docs/roadmap.md)
for the plan.

## Prerequisites

- Node.js >= 22
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

Other root-level scripts:

```bash
pnpm build   # compile the API
pnpm test    # run the API's unit tests
```

## Repo layout

```
apps/
  api/    NestJS API (only app that currently has code)
  web/    reserved for a future web client — empty for now
docs/
  architecture/   reserved for architecture notes — empty for now
  decisions/      Architecture Decision Records (ADRs)
  learning/       day-by-day learning notes
  roadmap.md      the 30-day build plan
```

There is no `packages/` directory yet — it's intentionally deferred until
the API and web app both exist and actually need to share code. See
[ADR-001](docs/decisions/ADR-001-monorepo.md) for why.
