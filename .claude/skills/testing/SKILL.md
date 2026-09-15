---
name: testing
description: The Vitest strategy for the CSV Spell Checker — the three vitest projects (server/client/storybook), where tests live, and what must be tested (CSV round-trip, word tokenising, language sampling, edit history, stale spellcheck results). Load when writing or running tests, or before committing changes under `src/lib/csv/`, `src/lib/spellcheck/`, `src/lib/languages/` or `src/lib/workbook/`.
---

# Testing

Vitest, configured inside `vite.config.ts` (no separate vitest config). Three
projects:

| Project     | Environment           | Picks up                                               |
| ----------- | --------------------- | ------------------------------------------------------ |
| `server`    | node                  | `src/**/*.{test,spec}.ts` — pure logic                 |
| `client`    | chromium (playwright) | `src/**/*.svelte.{test,spec}.ts` — DOM, runes, workers |
| `storybook` | chromium              | every story, as a render smoke test                    |

`npm run test` runs all three once. Run one project with
`npx vitest run --project server`.

The bar is not coverage. It is: **the things that could corrupt the user's data or
mislead them about spelling are tested, against real inputs.**

## Where tests live

Under `src/tests/`, mirroring the source tree: a test for `src/lib/csv/parse.ts`
is `src/tests/lib/csv/parse.test.ts`. Import the subject through `$lib/…`, never a
relative path. Shared fixtures go in `src/tests/support/`.

## Priorities

1. **CSV round-trip** — parse → serialise must reproduce the cell values exactly:
   quoted fields, embedded commas, doubled quotes, embedded newlines, CRLF and LF,
   a UTF-8 BOM, trailing newline, ragged rows, empty cells. Paste parsing (tab
   separated) gets the same treatment. Exporting is where a bug silently damages
   the user's file.
2. **Word tokenising** — which substrings of a cell are spell-checked and their
   offsets: apostrophes and elisions (`don't`, `l'homme`), hyphenated words,
   accented letters, numbers, URLs, e-mail addresses. Offsets drive the underline.
3. **Language sampling** — exactly the first 10 non-header rows, all columns
   combined; the detected code → supported language mapping; when a guess counts
   as low confidence (nothing pre-filled) or unsupported; falling back from the
   built-in detector to Franc. Inject a fake detector through `DetectOptions`.
4. **Workbook and edit history** — undo/redo order, redo cleared by a new edit,
   edited-cell tint surviving undo, closing tabs picks the right neighbour, sheet
   naming.
5. **Stale spellcheck results** — a result for text that no longer matches the
   cell is ignored, so a slow full-sheet check cannot overwrite a single-cell
   re-check.

The spellcheck worker itself runs in the `client` project (a real `Worker`, a
real dictionary — English is small enough to load in a test).

## Rules

- `expect.requireAssertions` is on: every test must assert something.
- `.svelte.test.ts` routes a test to the browser project — use it for anything
  needing a DOM, runes or a Worker, not just components.
- Test real inputs, not mocks: real CSV strings, real dictionaries.
- Run `npm run test` green before committing changes under `src/lib/csv/`,
  `src/lib/spellcheck/`, `src/lib/languages/` or `src/lib/workbook/`.
