# Setting Neuron Up On A New Machine

Everything needed to pick this project up on another computer. Rewritten on
2026-10-10, at the close of Screens Day; section 6 updated the same day when
work moved from days to features.

---

## 1. What the machine needs

| Thing | Version | Notes |
|---|---|---|
| Node | 24 or newer | The web app's tests run TypeScript files with Node alone, which Node does without a flag only from version 24 |
| pnpm | 11.17.0 | `corepack enable` provides it. npm and yarn will not work: this is a pnpm workspace with a pnpm lockfile |
| git and `gh` | any recent | `gh` is the GitHub command line tool; each feature closes with a pull request |
| Docker, with `docker compose` | any recent | Runs the Postgres server the API and the tests use (`compose.yaml`) |

`argon2` is a native module and may compile on install. On Linux that needs
build tools (`build-essential` on Debian and Ubuntu, `gcc-c++ make` on
Fedora). If `pnpm install` fails with a node-gyp error, this is why.

## 2. Getting it running

```bash
git clone <repo-url> neuron
cd neuron
pnpm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

The root `.env` does not work as copied. `JWT_SECRET` must be replaced with a
generated value; the command is written in `.env.example`. `DATABASE_URL` and
`WEB_ORIGIN` are already right for local work. `apps/web/.env.local` works as
copied.

The journal lives in Postgres, in Docker. Start the server, from the
repository root, before anything else:

```bash
docker compose up -d
```

It runs in the background and keeps its data in a Docker volume,
`neuron-postgres`, so stopping it (`docker compose down`) or restarting the
machine loses nothing. After a restart, run `docker compose up -d` again.
`docker compose ps` says whether it is running. The database, the user and
the password are all `neuron`, and the server answers only on this machine.

The server starts with an empty database and no tables, and the API never
makes them:

```bash
pnpm migration:run
```

Run it again whenever new migrations arrive. The code does not work on a
database that lacks its newest columns. Then, each in its own terminal:

```bash
pnpm dev        # the API, http://localhost:3000
pnpm dev:web    # the web app, http://localhost:3001
```

Open `http://localhost:3001` and create an account. Then run the nine checks:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
```

`pnpm test` and `pnpm test:e2e` need the Postgres server running too. Each
test file makes a database of its own in it, with a random name, and drops it
when the file is done, so the journal's database is never touched. If the
server cannot be reached, the run stops at once with a message that says to
run `docker compose up -d`; it never skips the tests. To run them against
another server, set `TEST_DATABASE_URL` to its address.

Expected after the move to Postgres (2026-10-27): all clean, 585 API unit
tests, 68 API end-to-end tests, 290 web tests and 5 component tests, and 10
checks on the shared package.

`packages/contracts` is compiled to `packages/contracts/dist/`, which is
gitignored. Every root script that needs it builds it first. While changing
that package, `pnpm --filter @neuron/contracts dev` rebuilds it on every
save.

If `typecheck:web` fails inside `apps/web/.next/` after a page folder was
renamed, delete `apps/web/.next`. It is generated, gitignored, and rebuilt on
the next build.

## 3. Moving the existing journal

Until feature 8 the journal was a SQLite file, `apps/api/data/neuron.db`. The
API no longer reads it, and nothing copies it into Postgres: she archives that
file herself. The voice memos' audio is still in `apps/api/data/audio`.

To carry the journal to another machine now, copy the Postgres database with
`pg_dump` and `pg_restore` (or `psql`), and copy `apps/api/data/audio` beside
it. Run `pnpm migration:run` afterwards.

## 4. What git does not carry

- **`.env` and `apps/web/.env.local`.** Recreate them from the examples.
- **The journal itself**: the Postgres volume `neuron-postgres`, and the
  audio in `apps/api/data/audio`.
- **`docs/workers/`**, every worker prompt. Copy it by hand if you want it.
- **Some worker reports.** `.gitignore` ignores any file named exactly
  `report.md` under `docs/learning/`, with a named exception for Day 8. Reports
  with other names (`report-api.md`, `report-web.md`, `report-15b.md` and so on)
  are committed. So the reports of Days 2 to 7, 15 and 17a are local only; the
  Day 2 to 8 reports also have copies in `docs/archive/reports/`. Whether to
  commit the rest is an open question in `master-state.md`.
- **The mentor session's memory** (next section).

## 5. The Claude Code memory

The Master Thread keeps memory outside the repository, at:

```
~/.claude/projects/-home-<user>-Workspace-neuron/memory/
```

Thirteen files and an index, `MEMORY.md`. They hold the teaching rules, the
writing style, the learner profile, the old day numbering, the branch rule,
the feature-based plan, and her rulings on who decides product questions. **A copy as of 2026-10-10 is in
`docs/archive/agent-memory/`.** The directory name contains the username and
the project path, so on a new machine create the new path and copy the files
into it. Without them a new session loses the teaching rules, and the writing
drifts back to terse status English.

## 6. How the work runs

The full rules are in `docs/master-state.md`, under *How To Work With The
Learner*. In short:

- **The Master Thread** teaches, records decisions, writes worker prompts and
  audits. It does not write production code.
- **Workers** are subagents the Master Thread launches with a short spec
  from `docs/workers/`. Their standing rules are in `CLAUDE.md` at the
  repository root. They implement, run all nine checks, and write a short
  report. They never touch git.
- **She decides**, as short choices with the cost of each stated. She or her
  husband sets the feature boundary.
- **Work is planned by feature** (`docs/features.md` for scope,
  `docs/roadmap.md` for order). A feature opens with an overview and its
  block count, then repays any learning debt, then takes one block at a time.
  It ends with an audit that includes one mutation, and with a pull request
  she merges.
- **Each feature has a branch**, `feature-<short-name>`, made from `main`
  before work starts.
