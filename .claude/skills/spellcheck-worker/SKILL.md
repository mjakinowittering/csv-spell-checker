---
name: spellcheck-worker
description: Background spellcheck — the Web Worker, Typo.js with Hunspell dictionaries, how dictionaries are copied and served, word tokenising, the worker message protocol, flag state on the sheet (including stale-result handling), flagged-cell rendering, and Franc language detection. Load when working on the worker, dictionaries, tokenising rules, spelling flags or the issue count, or language detection.
---

# Spellcheck worker

`CLAUDE.md` invariants that apply here: **full-sheet spellcheck runs in the Web
Worker, never on the main thread**; **after an edit only that cell is re-checked**;
**flagged cells show a squiggly underline plus a ring that persist at rest**;
**supported languages are English UK, English US, French, German and Spanish**.

## Files

| file                                           | role                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| `src/lib/spellcheck/tokenize.ts`               | which words are checked; `findMisspellings`              |
| `src/lib/spellcheck/segments.ts`               | split a cell's text into plain / misspelled runs         |
| `src/lib/spellcheck/protocol.ts`               | worker request / response types                          |
| `src/lib/spellcheck/spellcheck.worker.ts`      | loads dictionaries, checks sheets and cells              |
| `src/lib/spellcheck/spellchecker.ts`           | main-thread client; routes results to sheets             |
| `src/lib/workbook/sheet.svelte.ts`             | flags, `checkState`, `issueCount`, `flaggedCells()`      |
| `src/lib/components/grid/SheetCellText.svelte` | ring + wavy underline rendering                          |
| `src/lib/languages/detect.ts`                  | Franc sampling and confidence (runs in the parse worker) |
| `scripts/copy-dictionaries.js`                 | copies dictionaries into `static/dictionaries/`          |

## Dictionaries

The `dictionary-*` packages only expose their files through Node's `fs`, so
`npm run dictionaries` (run automatically before `dev` and `build`) copies each
`index.aff`, `index.dic` and `license` into `static/dictionaries/<code>/`. That
directory is gitignored. Keep the script's code list in step with
`LANGUAGE_CODES`.

| code    | package            | licence                      |
| ------- | ------------------ | ---------------------------- |
| `en-GB` | `dictionary-en-gb` | MIT and BSD                  |
| `en-US` | `dictionary-en`    | MIT and BSD                  |
| `fr`    | `dictionary-fr`    | MPL-2.0                      |
| `de`    | `dictionary-de`    | GPL-2.0 or GPL-3.0           |
| `es`    | `dictionary-es`    | GPL-3.0, LGPL-3.0 or MPL-1.1 |

The worker fetches them from `<base>/dictionaries/`, a URL the page resolves
lazily (it is prerendered, so `location` is unavailable at module load).

**Italian is descoped.** Typo.js expands every affixed word form into one `Map`;
Italian produces more than the V8 limit (~16.7M entries) and throws. Typo.js is
also slow on French (~3.4s, ~320MB). `hunspell-wasm` loads all of them in under
100ms and is a README todo item.

## Protocol

- `init { dictionaryBase }` — once, when the worker starts.
- `check-sheet { sheetId, rows, languages }` → `sheet-progress` … then one
  `sheet-result { flags }` listing only cells with misspellings.
- `check-cell { sheetId, row, column, text, language }` → `cell-result { cell }`
  (empty `ranges` means the cell is now clean).
- `dictionary-error { language }` — the page shows a toast; those columns stay
  unchecked.

Dictionaries load once per worker and are shared across sheets; checked words
are memoised per language.

## Tokenising

A word is letters/marks joined by internal apostrophes or hyphens. Skipped:
anything containing a digit or underscore, all-capital words (acronyms), single
letters, URLs and e-mail addresses. Hyphenated compounds are checked part by
part. Curly apostrophes are normalised, and elisions (`l'homme`, `qu'il`) pass
when the elided word is correct. Offsets are UTF-16, as used by `String.slice`.

## Flag state and stale results

- Every result carries the exact text the worker checked. A result whose text no
  longer matches the cell is ignored.
- `beginCheck()` starts a full check. Cells written while it runs are recorded;
  when `sheet-result` arrives, those cells keep whatever their own `cell-result`
  set, even if it arrived first. This is what stops a slow full-sheet result
  overwriting a newer single-cell re-check.
- Flags never touch the edited tint, and vice versa.

## Rendering

`SheetCellText` puts `sheet-cell-flagged` (inset ring) on a flagged cell and wraps
each misspelled range in `sheet-misspelling` (wavy destructive underline). Both
classes live in `layout.css`; the status bar legend reuses them.
