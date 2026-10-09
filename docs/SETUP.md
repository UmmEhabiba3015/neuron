# Setting Neuron Up On A New Machine

Everything needed to pick this project up on another computer. Rewritten on
2026-10-10, at the close of Screens Day.

---

## 1. What the machine needs

| Thing | Version | Notes |
|---|---|---|
| Node | 24 or newer | Both apps load TypeScript files from `packages/contracts` directly, which Node does without a flag only from version 24 |
| pnpm | 11.17.0 | `corepack enable` provides it. npm and yarn will not work: this is a pnpm workspace with a pnpm lockfile |
| git and `gh` | any recent | `gh` is the GitHub command line tool; each day closes with a pull request |

`better-sqlite3` is a native module and compiles on install. On Linux that
needs build tools (`build-essential` on Debian and Ubuntu, `gcc-c++ make` on
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
generated value; the command is written in `.env.example`. `WEB_ORIGIN` is
already right for local work. `apps/web/.env.local` works as copied.

There is no database yet, and that is expected. The API creates the file but
never the tables:

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

Expected at the close of Screens Day: all clean, 246 API unit tests, 365 API
end-to-end tests, 171 web tests and 7 checks on the shared package.

If `typecheck:web` fails inside `apps/web/.next/` after a page folder was
renamed, delete `apps/web/.next`. It is generated, gitignored, and rebuilt on
the next build.

## 3. Moving the existing journal

`apps/api/data/neuron.db` is gitignored, so a clone starts empty. To carry
the real journal across, copy that file, then run `pnpm migration:run`.

**A database made before Day 8** has no `migrations` table, so TypeORM tries
to create `entries` again and stops. Record the first migration as already
applied, once, **from `apps/api`** (from the repository root the module is not
found):

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

There is deliberately no `sqlite3` command here: that tool is not installed.

## 4. What git does not carry

- **`.env` and `apps/web/.env.local`.** Recreate them from the examples.
- **`apps/api/data/neuron.db`**, the journal itself.
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

Twelve files and an index, `MEMORY.md`. They hold the teaching rules, the
writing style, the learner profile, the day numbering, the branch rule, and
her rulings on who decides product questions. **A copy as of 2026-10-10 is in
`docs/archive/agent-memory/`.** The directory name contains the username and
the project path, so on a new machine create the new path and copy the files
into it. Without them a new session loses the teaching rules, and the writing
drifts back to terse status English.

## 6. How a working day runs

The full rules are in `docs/master-state.md`, under *How To Work With The
Learner*. In short:

- **The Master Thread** teaches, records decisions, writes worker prompts and
  audits. It does not write production code.
- **Workers** are fresh Claude Code sessions given one prompt from
  `docs/workers/`. They implement, run all nine checks, and write a report.
  They never touch git.
- **She decides**, as short choices with the cost of each stated. She or her
  husband sets the feature boundary.
- **A day** opens with an overview and its block count, then repays any
  learning debt, then takes one block at a time. It ends with an audit that
  includes one mutation, and with a pull request she merges.
- **Each day has a branch**, `day-<number>-<topic>`, made from `main` before
  work starts.
