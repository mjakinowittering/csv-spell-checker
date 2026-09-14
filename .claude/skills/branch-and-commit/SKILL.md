---
name: branch-and-commit
description: Branch naming, commit message and pull request conventions. Load whenever about to create a git branch, stage or commit changes, write a commit message, or open a PR — and immediately after a plan has been approved, since approval is the only thing that permits a new branch.
---

# Branch and commit

Domain-agnostic git conventions. The project's `CLAUDE.md` still holds for what
goes into a change; this skill only covers how the change is recorded.

## When a branch may be created

**Branches are only created for approved plans.** An approved plan is one the
user has explicitly accepted — either through the `todo-review` flow or a
direct request that spells out the work. No approval, no branch: if work is
being discussed but not yet approved, keep discussing.

Reviewing the backlog, adding a todo item and pruning a todo item never create a
branch.

## Branch naming

```
<type>/<short-kebab-summary>
```

| type       | use for                                        |
| ---------- | ---------------------------------------------- |
| `feat`     | a new user-facing capability (README Features) |
| `fix`      | a defect (README Bugs)                         |
| `refactor` | restructuring with no behaviour change         |
| `perf`     | a measurable speed or memory improvement       |
| `test`     | tests only                                     |
| `docs`     | documentation, README, skills                  |
| `chore`    | tooling, config, dependencies, CI              |

- Lowercase, hyphen-separated, summary of 2–5 words, no trailing hyphen.
- Name the outcome, not the activity: `feat/csv-export`, not `feat/working-on-download`.
- One approved plan → one branch.

Branch from the up-to-date default branch. If the plan depends on work that is
on an unmerged branch, branch from that branch instead and say so when the
branch is created (a stacked branch).

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>

<body>

<trailers>
```

- **type** — the same vocabulary as branch types.
- **scope** — optional; the area of the codebase touched, one lowercase word
  or kebab phrase. Reuse scopes that already appear in `git log`.
- **summary** — imperative mood ("add", not "added"/"adds"), lowercase first
  letter, no trailing full stop, header line ≤ 72 characters.
- **body** — optional for trivial changes, otherwise: why the change was made
  and anything a reviewer would not see from the diff. Wrap at 72.
- **trailers** — any attribution the environment requires (e.g.
  `Co-Authored-By`), last, after a blank line.

A breaking change adds `!` after the type/scope and a `BREAKING CHANGE:` footer.

## What goes into a commit

- One logical change per commit. A milestone may be several commits; a commit is
  never several unrelated changes.
- Stage explicit paths. Do not `git add -A` / `git add .` without first checking
  `git status` for files that don't belong (generated output, local config,
  someone else's untracked work).
- Never commit secrets, `.env` files, build output or generated code that is
  gitignored.
- The project's lint, type-check and test scripts (see `package.json`) pass
  before committing. If something is knowingly left failing, say so in the body.
- The final commit on a branch that implements a README todo item also ticks
  that item.

## Things that need the user to ask first

- Committing directly to the default branch.
- Pushing, or opening a pull request.
- Merging, rebasing, amending or force-pushing anything already pushed.
- Skipping hooks (`--no-verify`) or signing overrides.
- Deleting a branch.

## Pull requests

Only when asked.

- **Title** — the same format as a commit header.
- **Body** — what changed and why; the README todo item it closes, if any; how
  it was verified; known gaps. End with any attribution the environment
  requires.
- Target the branch this one was created from.
