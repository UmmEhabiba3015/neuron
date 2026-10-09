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
`~/.claude/projects/<project-path>/memory/`. Twelve files plus an index, as of
2026-10-10: the learner profile, the worker workflow, the day numbering, the
teaching mode, the writing style, the testing approach, the depth guardrail,
learning debt blocking the next day, the day overview, the branch rule, and
her two rulings on who decides product questions and what design text is.

Git does not carry that directory, and the path encodes both the username and
the project location, so it changes on a different machine. To restore it,
create the new path and copy these files into it. Without them a new
session loses the teaching rules, and the drift is not subtle: the register
returns to terse status-report English and questions stop coming before answers.
`docs/SETUP.md` restates the rules in full so they can be rebuilt if these files
are ever lost.

## Since the move

This directory was not gitignored again. `workers/` and `reports/` stop at
Day 8 and are not added to. `agent-memory/` is refreshed at each hand-off; it
was last refreshed on 2026-10-10.
