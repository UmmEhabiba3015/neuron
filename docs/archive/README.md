# Archive

Working artifacts that used to live only on one laptop.

Everything in here was gitignored until 2026-09-04. It is committed now for one
reason: the project is moving to a different machine, and these files are the
written record of how each day was specified and what each audit found. Losing
them would not stop the project running, and would lose most of the evidence of
how it was built.

**This directory is not source, and nothing imports from it.** It is kept apart
from `docs/decisions/`, `docs/roadmap.md` and the other living documents on
purpose. Those describe what is true now and are maintained. These describe what
was true on a particular day and are never edited after the fact.

## What is in here

**`workers/`** — the prompt given to each worker session. A worker is a fresh
Claude Code session handed one task file; it implements, runs the checks, and
writes a report. Reading these shows what was asked for, which is often more
revealing than what was delivered. Two of them contain corrections written in
after a mistake was found, and those are left visible rather than tidied.

**`reports/`** — what each worker reported back, arranged by day. These are the
worker's own account and were **not** taken on trust: every day was re-audited
by the Master Thread running the checks itself. Where the audit disagreed with
the report, the disagreement is recorded in `docs/master-state.md`.

**`agent-memory/`** — the mentoring session's persistent memory, which normally
lives outside the repository at
`~/.claude/projects/<project-path>/memory/`. Six files plus an index, covering
the learner profile, the worker workflow, the day numbering, the teaching mode,
the writing style, and the testing approach.

Git does not carry that directory, and the path encodes both the username and
the project location, so it changes on a different machine. To restore it,
create the new path and copy these seven files into it. Without them a new
session loses the teaching rules, and the drift is not subtle: the register
returns to terse status-report English and questions stop coming before answers.
`docs/SETUP.md` restates the rules in full so they can be rebuilt if these files
are ever lost.

## After the move

The plan is to gitignore this directory again once the project is running on the
new machine. If that happens, the copy committed here stays in git history and
remains recoverable; only new material stops being tracked.
