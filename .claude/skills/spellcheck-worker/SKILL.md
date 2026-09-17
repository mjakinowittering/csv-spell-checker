---
name: spellcheck-worker
description: Background spellcheck — the Web Worker, hunspell-wasm with Hunspell dictionaries, how dictionaries are copied and served, word tokenising, the worker message protocol, flag state on the sheet (including stale-result handling), flagged-cell rendering, and sheet language detection (Chrome's built-in detector with a Franc fallback, on the main thread). Load when working on the worker, dictionaries, tokenising rules, spelling flags or the issue count, or language detection.
---

# Spellcheck worker

`CLAUDE.md` invariants that apply here: **full-sheet spellcheck runs in the Web
Worker, never on the main thread**; **after an edit only that cell is re-checked**;
**flagged cells show a squiggly underline plus a ring that persist at rest**;
**the supported languages are the 14 in `LANGUAGE_CODES`**.

## Files

| file                                           | role                                                |
| ---------------------------------------------- | --------------------------------------------------- |
| `src/lib/spellcheck/tokenize.ts`               | which words are checked; `findMisspellings`         |
| `src/lib/spellcheck/segments.ts`               | split a cell's text into plain / misspelled runs    |
| `src/lib/spellcheck/protocol.ts`               | worker request / response types                     |
| `src/lib/spellcheck/spellcheck.worker.ts`      | loads dictionaries, checks sheets and cells         |
| `src/lib/spellcheck/spellchecker.ts`           | main-thread client; routes results to sheets        |
| `src/lib/workbook/sheet.svelte.ts`             | flags, `checkState`, `issueCount`, `flaggedCells()` |
| `src/lib/components/grid/SheetCellText.svelte` | ring + wavy underline rendering                     |
| `src/lib/languages/detect.ts`                  | sampling, thresholds, `LanguageGuess` (main thread) |
| `src/lib/languages/chrome-detector.ts`         | typed wrapper for Chrome's `LanguageDetector`       |
| `src/lib/languages/franc-detector.ts`          | Franc fallback, loaded on demand                    |
| `scripts/copy-dictionaries.js`                 | copies dictionaries into `static/dictionaries/`     |

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
| `it`    | `dictionary-it`    | GPL-3.0                      |
| `es`    | `dictionary-es`    | GPL-3.0, LGPL-3.0 or MPL-1.1 |
| `pt-PT` | `dictionary-pt-pt` | GPL-2.0, LGPL-2.1 or MPL-1.1 |
| `pt-BR` | `dictionary-pt`    | LGPL-3.0 or MPL-2.0          |
| `nl`    | `dictionary-nl`    | BSD-3-Clause or CC-BY-3.0    |
| `pl`    | `dictionary-pl`    | GPL-3.0, LGPL-3.0 or MPL-2.0 |
| `sv`    | `dictionary-sv`    | LGPL-3.0                     |
| `da`    | `dictionary-da`    | GPL-2.0, LGPL-2.1 or MPL-1.1 |
| `nb`    | `dictionary-nb`    | GPL-2.0                      |
| `cs`    | `dictionary-cs`    | GPL-2.0                      |

`dictionary-pt` is Brazilian Portuguese; `dictionary-pt-br` is a deprecated
empty package. Norwegian is Bokmål only (`no` and `nb` detections map to it;
Nynorsk is unsupported). Portuguese detections map to pt-BR only for a pt-BR
browser locale, like English to en-US.

The worker fetches them from `<base>/dictionaries/`, a URL the page resolves
lazily (it is prerendered, so `location` is unavailable at module load).

## Hunspell engine

`hunspell-wasm` (Hunspell compiled to WebAssembly):
`createHunspellFromStrings(aff, dic)` then `testSpelling(word)`, memoised per
language. It replaced Typo.js, which expanded every affixed form into one `Map`
(Italian overflowed V8's limit; French took ~3.4s and ~320MB). Its Emscripten
loader finds `hunspell.wasm` with `new URL(..., import.meta.url)`, so the package
is in `optimizeDeps.exclude`: pre-bundling would move the module away from the
file. The same build runs in Node for `src/tests/lib/spellcheck/dictionaries.test.ts`,
which checks every dictionary against real text.

## Language detection

Runs once per new sheet in `importer.ts`, after the parse worker returns and
while the loading screen is still up. Never in either worker.

1. `sampleText()` joins the first 10 non-header rows, all columns.
2. When `'LanguageDetector' in self`, `availability()` → `create()` →
   `detect(text)`, each with a 5s timeout. Its top score is the confidence;
   0.7 or more pre-fills. `unavailable`, or `create()` rejecting with
   `NotSupportedError`/`NotAllowedError`, falls back to Franc quietly; any other
   failure is logged with `console.error` and falls back too.
3. Franc (`francAll`, limited to ~35 European candidates so unsupported
   languages are recognised as themselves) always scores its best match 1, so
   confidence is the gap to the runner-up: 100+ letters and a gap of 0.04+
   pre-fills.

The result is a `LanguageGuess { detected, prefill, confidence, confident,
source }`. `prefill` is a supported code, `'unsupported'` (detected confidently
but not checkable: the column is skipped, like `none`) or `null` (below the
threshold: the confirmation screen pre-selects nothing and Continue stays
disabled until every column has a language). English maps to en-US only for an
`en-US` browser locale, otherwise en-GB. Tests inject `builtIn: null` or a fake
factory through `DetectOptions`.

The confirmation screen (`components/languages/`) is `LanguageConfirmation`:
the sheet-wide `LanguageSelect` fills its row, notices sit under it, then one
row that **never moves**: the "Override individual columns (N columns)" toggle
on the left and Cancel/Continue on the right. Expanding (`overridesOpen`,
bindable) relabels that same toggle "Hide individual columns" and opens
`ColumnLanguageOverrides` (per-column `LanguageSelect`s, `languages` bindable)
below the row. Confirming stores
`sheet.languages` and `sheet.sheetLanguage` (null when columns differ).

## Protocol

- `init { dictionaryBase }` — once, when the worker starts.
- `check-sheet { sheetId, rows, languages, ignoredWords }` → `sheet-progress` …
  then one `sheet-result { flags, languages }`: flags for cells with
  misspellings, `languages` for cells where a fallback language matched.
- `check-cell { sheetId, row, column, text, language, ignoredWords }` →
  `cell-result { cell, languages }` (empty `ranges` means the cell is now
  clean; empty `languages` means only the column's language matched).
- `dictionary-error { language }` — the page shows a toast; those columns stay
  unchecked.

Dictionaries load once per worker and are shared across sheets; checked words
are memoised per language.

## Fallback languages

A word its cell's language rejects is not flagged yet: it is tried against a
chain, and flagged only once every language in it has rejected it.

- `fallbackChain(primary)` (`src/lib/languages/fallbacks.ts`) is English first
  (`en-GB`, `en-US`), then `primary`'s family: Romance (`fr`, `it`, `es`,
  `pt-PT`, `pt-BR`), Central European (`de`, `nl`, `pl`, `cs` — grouped as
  neighbours, not by descent, because that copy mixes constantly), Nordic
  (`sv`, `da`, `nb`), and the English pair. The chain's length is the cap.
- `resolveFallbacks(words, primary, checkerFor)` (`src/lib/spellcheck/fallback.ts`)
  walks it, stopping at the first language that accepts each word, and returns
  the matched language or null. It asks `checkerFor` for a dictionary only
  while some word is still unmatched, so a fallback loads on first need and
  never for a sheet whose words all pass. A `checkerFor` returning null (a
  dictionary that would not load) simply moves to the next language; unlike a
  chosen column language, it raises no `dictionary-error`.
- The worker runs it per language, not per cell: `scanCell` splits a cell's
  words into accepted and rejected, `resolveScans` groups every rejection by
  primary language, then `cellOutcome` turns what is left into flags and counts.
  Dictionaries are cached in `checkers` for the worker's life, so a fallback
  loaded for one sheet is reused by the next.
- Each result carries `languages`: `CellLanguages` per cell for a sheet check,
  `[language, count][]` for a single cell, most words first, and only when more
  than the column's own language matched. `sheet.cellLanguages(row, column)`
  falls back to the column's language, and drives the editor's header flags and
  the bulk-fix safeguard's idea of a mixed cell.

## Ignored words

Each sheet has an ignore list (`sheet.ignoredWords`, persisted in its record).
Entries are `ignoreKey(word)`: lower-cased with curly apostrophes straightened,
so every casing of a word is ignored together. `findMisspellings(text, check,
ignored)` skips those tokens before the dictionary is consulted; hyphenated
compounds are matched part by part, like checking.

The sheet keeps each flagged cell's checked text alongside its ranges, so
`cellIssueWords(row, column)` (the editor's chips) and `flaggedWords()` (the
toolbar badge's "Flagged words across this sheet" dialog, deduplicated with
counts) read the words back exactly as they were flagged.

Every range is a `WordFlag`: `{ start, end, suggestions }`. The worker builds
each flagged word's list with `suggestionsFor` (`src/lib/spellcheck/suggestions.ts`;
straight apostrophes, top `MAX_SUGGESTIONS` = 3, memoised per language because
suggestions cost far more than checks) and sends them in both `sheet-result`
and `cell-result`. Hunspell gives lowercase words poor suggestions ("trés" →
trais, but "Trés" → Très), so a lowercase word is also looked up capitalised,
and those suggestions come first, lower-cased with `matchCase`. Every
capitalisation of a word thus gets the same corrections in its own case
(proper nouns are lower-cased too: "londn" → london).
`cellIssues()` and `flaggedWords()` expose each word's first available
suggestion.

`sheet.fixTargets(word)` lists every cell a sheet-wide Fix would rewrite, each
marked `mixed` when that cell's words matched more than one language. The
flagged-words dialog uses it for the safeguard: with no mixed cell it fixes
straight away, otherwise `BulkFixConfirm` lists them and offers fixing only the
single-language cells (`fixWord(word, cells)`) or all of them.

`sheet.fixWord(word, cells?)` is the sheet-wide Fix: for every flag whose cell still
holds the checked text, it rewrites each range with that key, in every
capitalisation, to its own top suggestion, or, when that spelling has none,
the word's first suggestion with `matchCase` applied (ranges are whole tokens,
so "Trésor" is never touched). It then shifts the
cell's remaining ranges, marks the cell edited and pushes all the edits as one
undo step. The page then persists and runs a full `checkSheet`.

Ignoring has two scopes. `sheet.dismissWord(row, column, word)` is the cell
editor's **Ignore**: it records a `dismissalKey` (`row:column:wordKey`) in
`sheet.dismissedWords`, drops that word's ranges from that cell, and needs no
re-check — the word stays flagged everywhere else. Every later result is
filtered through those dismissals, so a full check cannot bring the occurrence
back.

`sheet.ignoreWord(word)` is **Ignore All**: it adds the key and clears that
word's ranges from every flag at once, so the UI updates immediately. The page then persists the sheet
and runs a full `checkSheet` in the worker with the new list, which is
authoritative. Every later `check-cell` sends the list too.

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
- A flagged cell hides the green edited style; the edited state itself is never changed by flags.

## Rendering

`SheetCellText` puts `sheet-cell-flagged` (inset ring) on a flagged cell and wraps
each misspelled range in `sheet-misspelling` (wavy destructive underline). Both
classes live in `layout.css`; the status bar legend reuses them.

## Issue navigation

The toolbar's previous/next buttons move `sheet.currentIssue` with
`adjacentIssue()` (`src/lib/spellcheck/navigation.ts`): reading order, row by
row then left to right, wrapping at both ends. The position is kept after its
issue is fixed, so navigation continues from the same place. `SheetGrid` watches
`currentIssue`, scrolls the cell into view and, for body rows, gives it keyboard
focus on the next frame (a scrolled-in row only renders then) so Enter opens the
editor. `SheetCellText` outlines the current issue with `sheet-cell-current`.
