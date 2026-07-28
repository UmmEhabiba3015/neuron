# Worker Report: Day 2 — Project Setup

## Objective

Turn the Day-2 Neuron repo (stub `package.json`, empty `pnpm-workspace.yaml`,
empty `.gitignore`, empty speculative directories) into a correctly
configured pnpm workspace with one booting NestJS API serving a single
hardcoded `GET /entries` endpoint. No database, no auth, no frontend, no
Docker, no CI.

## Implementation Summary

1. **Directory cleanup.** Deleted `docker/`, `.github/`, `packages/`
   (`config`, `shared`, `types`), `docs/api/`, `docs/database/` — all empty
   and speculative. Kept `docs/architecture/` and `docs/decisions/`.
   Created `docs/learning/day-02/`. `apps/web/` was **not** deleted — it
   wasn't in the explicit delete list, so it was left as an empty
   placeholder for a future web client.

2. **Root `package.json`** rewritten: `name: "neuron"`, `private: true`,
   `packageManager: "pnpm@11.17.0"`, `engines.node: ">=22"`. Removed
   `version`, `main`, `type`, `keywords`, `author`, `license`,
   `description`, and the stub `test` script. Added `dev`/`build`/`test`
   scripts that delegate to `@neuron/api` via `pnpm --filter`.
   **Dropped `devEngines`** — see Decisions below.

3. **`pnpm-workspace.yaml`**: declares only `apps/*`. `packages/*` is
   intentionally not listed (that directory doesn't exist yet — see
   ADR-001). It also picked up an `allowBuilds` block during `pnpm
   install` — see Decisions.

4. **`.gitignore`**: `node_modules/`, `dist/`, `build/`, `.env` +
   `.env.*` (with `!.env.example` re-allowed), `coverage/`, editor dirs
   (`.vscode/`, `.idea/`, swap files), OS cruft (`.DS_Store`,
   `Thumbs.db`), and logs.

5. **Scaffolded NestJS** into `apps/api` using `@nestjs/cli@latest`
   (resolved to Nest CLI 11.0.24, Nest framework packages `^11.0.1`),
   TypeScript, pnpm as package manager, `--skip-git` (confirmed no nested
   `.git` was created), `--strict` TypeScript. Renamed the generated
   package from `"api"` to `"@neuron/api"`. Left all generated
   eslint/prettier/jest config untouched.

6. **Journal entries module**, generated via `nest g module/controller/service
   entries` (so the generated spec files follow the CLI's own conventions):
   - [entries.service.ts](apps/api/src/entries/entries.service.ts) owns a
     hardcoded array of two `JournalEntry` objects (`id`, `content`,
     `createdAt` only) and exposes `findAll()`.
   - [entries.controller.ts](apps/api/src/entries/entries.controller.ts)
     maps `GET /entries` to that method and returns its result directly.
   - [entries.module.ts](apps/api/src/entries/entries.module.ts) wires
     controller + service together.
   - [entry.interface.ts](apps/api/src/entries/entry.interface.ts) defines
     the minimal shape.
   - Each file has a short comment explaining *why* the module/controller/
     service split exists (not what the code does).
   - Removed the default `AppController`/`AppService` hello-world files and
     updated `app.module.ts` to import only `EntriesModule`.

7. **[ADR-001-monorepo.md](docs/decisions/ADR-001-monorepo.md)** — decision
   to use a pnpm workspace, alternatives (a) two repos, (b) unlinked
   monorepo, (c) hand-maintained shared types, (d) generated OpenAPI
   client, full pros/cons/tradeoffs, and explicit note that `packages/` is
   deferred, not abandoned.

8. **[ADR-002-nestjs.md](docs/decisions/ADR-002-nestjs.md)** — decision to
   use NestJS, alternatives (raw `http`, Express, Fastify, NestJS), and an
   explicit statement that Nest does not *force* good structure — it makes
   separated controller/service files the CLI's default generated output,
   which is a materially different (weaker, more honest) claim.

9. **README.md** rewritten: one-paragraph description, prerequisites,
   install/run instructions, and today's actual repo layout — no planned
   features described as if they exist.

## Files Changed

**Modified:** `package.json`, `pnpm-workspace.yaml`, `.gitignore`,
`README.md`.

**Deleted:** `docker/`, `.github/`, `packages/` (and its three empty
subdirs), `docs/api/`, `docs/database/`.

**Created:**
- `docs/learning/day-02/` (empty, per instructions)
- `docs/decisions/ADR-001-monorepo.md`, `docs/decisions/ADR-002-nestjs.md`
- `apps/api/**` — full NestJS scaffold (see file list in the diff; not
  reproduced here since it's CLI-generated boilerplate plus the
  entries module).

**Untouched:** `docs/architecture/` (still empty), `apps/web/` (still
empty), `docs/roadmap.md`, `docs/decisions/adr-001-monorepo.md` (see
Decisions below re: this last one).

## Decisions Made

- **Dropped `devEngines` from root `package.json`.** `packageManager`
  (via Corepack) is an *enforced* pin — running any package-manager
  command with the wrong tool actually fails. `devEngines.packageManager`
  is purely advisory and, with `onFail: "download"`, would silently try to
  download a different pnpm than the one already pinned. Keeping both is
  redundant config saying the same thing two different ways, which is
  exactly the kind of thing a beginner reading this file would have to
  puzzle over for no benefit. Kept only `packageManager`.

- **`pnpm-workspace.yaml` gained an `allowBuilds` block I didn't write by
  hand.** Modern pnpm blocks postinstall scripts from dependencies by
  default and records approvals in the workspace file. `pnpm install`
  flagged `unrs-resolver` (a native dependency pulled in transitively by
  `jest-resolve`, part of Nest's CLI-generated `devDependencies`, not
  anything I added). I set `allowBuilds: { unrs-resolver: true }` because
  it's a standard part of Jest's own dependency tree, not a third-party
  addition. This is disclosed here since it's the one file change beyond
  what the task explicitly described.

- **Root `dev` script calls `start:dev`, not a script literally named
  `dev`.** The task says the root should have `dev`/`build`/`test`
  scripts that delegate to the api workspace. Rather than inventing a
  `"dev"` alias inside the CLI-generated `apps/api/package.json` (which
  the task says to leave alone), the root's `dev` script calls Nest's own
  `start:dev` (watch mode) via `pnpm --filter @neuron/api start:dev`. This
  keeps the generated package.json completely untouched except for the
  `name` field.

- **Used `nest generate module/controller/service` instead of hand-writing
  the entries module files**, so the generated `.spec.ts` files match the
  CLI's own conventions exactly (same as the rest of the generated
  boilerplate the task says to leave alone).

- **Flagging a conflict, not resolving it:** `docs/decisions/` already
  contained a file, `docs/decisions/adr-001-monorepo.md` (lowercase),
  written in a different format (a working-notes/audit style, not the
  Decision/Problem/Alternatives/... ADR template this task specifies), and
  `docs/roadmap.md` references it by name ("Day 2, ADR-001"). Since Linux
  is case-sensitive, `ADR-001-monorepo.md` (this task's deliverable) and
  `adr-001-monorepo.md` (pre-existing) now coexist as two different files
  both claiming to be "ADR-001" about the same decision. I did not touch,
  rename, or delete the pre-existing lowercase file — it wasn't in this
  task's scope and it looked like existing in-progress work, not scaffolding.
  **This needs a human decision**: likely candidates are renaming the old
  file to something like `docs/learning/day-02/monorepo-audit.md` (it reads
  more like a working audit than a formal ADR) and updating the
  `roadmap.md` cross-reference, or merging the two. I did not guess at
  which, per "do the task as specified and flag disagreement."

- **`apps/web/` was not deleted.** It's empty and speculative like the
  directories that were explicitly listed for deletion, but the task's
  delete list didn't name it, and the objective's "no frontend" scope
  reads as "don't build one," not "remove its placeholder." Left as-is to
  avoid expanding scope in either direction.

## Assumptions

- "Latest stable NestJS" = whatever `@nestjs/cli@latest` and its generated
  `package.json` resolved to at scaffold time (Nest CLI 11.0.24, Nest
  framework packages `^11.0.1`, actually installed `11.1.28` per the
  caret range).
- The two hardcoded journal entries are flavor text (about building
  Neuron itself) rather than arbitrary placeholder strings — seemed more
  useful as a working example than `"lorem ipsum"`.
- "Keep whatever the CLI generates for eslint/prettier/jest" was read as
  permission to update generated *test content* to match the new
  controller/service (since the default tests assert hello-world behavior
  that no longer exists), while leaving all tooling *configuration*
  (`eslint.config.mjs`, `.prettierrc`, the `jest` block in `package.json`,
  `tsconfig*.json`) completely untouched.

## Limitations

- No database, auth, validation, or DTOs — as specified, these are Day 3+
  concerns.
- The hardcoded entries reset on every server restart; there is no
  persistence yet.
- `docs/architecture/` remains empty; nothing in this task's scope called
  for content there.
- The ADR-001 filename collision (above) is left for a human decision.

## Dependencies Added

Everything under `apps/api/package.json` is exactly what `@nestjs/cli`
installs for a new TypeScript project — nothing added on top:

- **Runtime:** `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`,
  `reflect-metadata`, `rxjs`.
- **Dev/tooling:** `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing`,
  ESLint + `typescript-eslint` + Prettier stack, Jest + `ts-jest`,
  `supertest`, TypeScript, `ts-node`, `tsconfig-paths`, `source-map-support`,
  `ts-loader`.

No workspace-root dependency was added — the root `package.json` has no
`dependencies` or `devDependencies` section at all, only scripts that
delegate to the api workspace.

## Testing Performed (real output)

**Clean install:**
```
$ pnpm install
Scope: all 2 workspace projects
✓ Lockfile passes supply-chain policies
Packages: +639
Done in 4s using pnpm v11.17.0
```

**Build:**
```
$ pnpm build
$ pnpm --filter @neuron/api build
$ nest build
(no output — clean compile)
```

**Unit tests:**
```
$ pnpm test
$ pnpm --filter @neuron/api test
$ jest

Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Ran all test suites.
```

**E2E test** (run from `apps/api`, not wired to a root script since the
task only asked for `dev`/`build`/`test`):
```
$ pnpm test:e2e
$ jest --config ./test/jest-e2e.json
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Ran all test suites.
```

**Dev server boot + live curl:**
```
$ pnpm dev
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [InstanceLoader] EntriesModule dependencies initialized
[Nest] LOG [RoutesResolver] EntriesController {/entries}:
[Nest] LOG [RouterExplorer] Mapped {/entries, GET} route
[Nest] LOG [NestApplication] Nest application successfully started

$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:3000/entries
[{"id":"1","content":"Started building Neuron today. The repo is finally wired up as a real workspace.","createdAt":"2026-07-28T09:00:00.000Z"},{"id":"2","content":"First endpoint is live: GET /entries. Small win, but it proves the whole chain works.","createdAt":"2026-07-28T10:30:00.000Z"}]
HTTP_STATUS:200
```

**Git status** (no build artifacts staged):
```
$ git status
Changes not staged for commit:
	modified:   .gitignore
	modified:   README.md
	modified:   package.json
	modified:   pnpm-workspace.yaml
Untracked files:
	apps/
	docs/
	pnpm-lock.yaml

$ git status --porcelain | grep -E "node_modules|dist/"
(no output — clean)
```

## Future Improvements

(Explicitly out of scope for this task — listed only because the roadmap
already names them.)

- Day 3: real persistence, replacing the hardcoded array.
- Day 5: validation and DTOs for a `POST /entries` endpoint.
- Resolve the ADR-001 filename collision noted above.
- Once `apps/web` gets real code, revisit whether `packages/types` or a
  generated OpenAPI client (both discussed in ADR-001) is needed.

## Lessons Learned

- pnpm's newer supply-chain guard (blocking postinstall scripts by
  default, recording approvals in `pnpm-workspace.yaml`) fired
  unprompted on a completely stock Nest dependency (`unrs-resolver`, via
  `jest-resolve`). Worth knowing this will happen on a clean install even
  when nothing unusual was added — it's not a sign of a bad dependency.
- Nest's CLI generators (`nest g module/controller/service`) produce spec
  files with a specific default shape (`should be defined` only, no
  providers wired for a controller that has a service dependency). Using
  the generator and then filling in the body kept the generated tests
  "CLI-shaped" rather than hand-rolled, which mattered given the
  instruction to keep whatever the CLI generates.
