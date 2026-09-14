---
name: todo-review
description: Triage the README.md Todo backlog — read the Bugs and Features subsections, present a continuously numbered digest of open items, then plan one item, add a new one, or prune a stale one. Load when the user asks what to work on next, to review / triage / groom the todo list or backlog, to plan a numbered todo item, to add a bug or feature to the todo, or to remove an outdated item. No branch is created until a plan is approved.
---

# Todo review

The backlog lives in `README.md`, under a `## Todo` heading. This skill is the
only process for reading and changing it. It is domain-agnostic: it knows the
shape of the list, not what the items mean — for that, load the domain skill
from the Skills Index in `CLAUDE.md` once an item is chosen.

## Backlog format

```markdown
## Todo

### Bugs

#### <Theme>

- [ ] **Short title** — one-line description of the defect and where it shows.

### Features

#### <Theme>

- [ ] **Short title** — one-line description of the outcome.
- [x] **Short title** — completed items stay until pruned.
```

- `### Bugs` comes before `### Features`. Both headings always exist.
- Every item sits under a `#### Theme` heading inside its subsection. Themes are
  short noun phrases for an area of the product; reuse an existing theme before
  inventing one.
- `- [ ]` is open, `- [x]` is completed.
- A subsection with nothing in it holds a single italic placeholder line (e.g.
  `_No open bugs._`), which is not an item.
- Numbers are **never written into the file**. They exist only in the digest.

## Numbering

Walk the file top to bottom: Bugs first, then Features, themes in document
order, items in document order. Give each **non-completed** item the next
integer, starting at 1. Numbering is continuous across both subsections — if
Bugs has 3 open items, the first open Feature is 4. Completed items get no
number and are left out of the digest.

Numbers are regenerated on every review and after every change. Never reuse a
number from an earlier digest after the list has changed; re-present the digest
instead.

## Workflow

### 1. Read

Read `README.md` and locate `## Todo`. If the section is missing, or `### Bugs`
/ `### Features` is missing, say so and offer to add the skeleton — do not
guess at a different structure.

Note anything malformed rather than silently fixing it: an item outside a theme
heading, a checkbox that isn't `[ ]` or `[x]`, an empty theme heading.

### 2. Present the digest

```
Bugs (2 open)
  Grid
    1. Title — description
  Import
    2. Title — description

Features (3 open)
  Export
    3. Title — description
    4. Title — description
  Shell
    5. Title — description
```

Show the open count per subsection, and `none` for an empty one. Put any
malformed-entry notes under the digest.

### 3. Ask what to do

Offer exactly three actions (use `AskUserQuestion`):

- **Plan an item** — the user names a number.
- **Add an item** — a new bug or feature.
- **Prune an item** — the user names a number.

### 4a. Plan an item

1. Resolve the number against the digest just shown. Restate the item so the
   user can catch a wrong number.
2. Load the domain skill(s) from the `CLAUDE.md` Skills Index that cover it.
3. Read the code the item touches. Verify the item is still valid — if it is
   already done or no longer applies, say so and suggest pruning instead.
4. Write the plan: goal, approach, files to change, which `CLAUDE.md` General
   Rules it touches and how they stay intact, how it will be verified.
   Use plan mode for this so nothing is edited before approval.
5. Wait for explicit approval. Revise on feedback; a revised plan needs
   approval again.
6. **Only once approved**, create the branch following the
   `branch-and-commit` skill, then implement.
7. Tick the item (`- [ ]` → `- [x]`) in the final commit on that branch.

One item at a time. Never plan several items into one branch unless the user
explicitly asks to bundle them.

### 4b. Add an item

1. Ask: bug or feature; which theme (list existing themes in that subsection,
   or a new one); a short title; a one-line description.
2. Show the exact line and its placement, then write it into `README.md`
   under the chosen theme, at the end of that theme's list. Create the theme
   heading if new; remove the placeholder line if the subsection was empty.
3. Re-present the digest with fresh numbers.

Adding an item is backlog grooming, not a plan: no branch, no commit unless the
user asks.

### 4c. Prune an item

1. Resolve and restate the item. Where it is checkable, look in the code for
   evidence that it is stale (already built, superseded, no longer relevant)
   and report what you found.
2. Get explicit confirmation before removing it.
3. Delete the line — do not tick it; a tick means the work was done. Remove the
   theme heading if it is now empty, and restore the placeholder if the
   subsection is now empty.
4. Re-present the digest with fresh numbers.

As with adding: no branch, no commit unless the user asks.

## Rules

- No branch before an approved plan. Reviewing, adding and pruning never branch.
- Never renumber, reorder or reword existing items as a side effect of another
  action.
- Never write digest numbers into `README.md`.
- Only the user decides to prune; you may suggest candidates with evidence.
- Completed items may also be pruned on request, but are never shown in the
  digest.
