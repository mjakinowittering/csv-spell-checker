---
name: persistence
description: IndexedDB persistence for open sheets — the `idb` store layout, what is and is never stored, the write-through call sites for every mutating action, and how sheets are restored on load. Load when adding anything a user can change about a sheet (it must be persisted), when touching `src/lib/persistence/`, `Sheet.toRecord`/`fromRecord` or `Workbook.restore`, or when debugging sheets that do not come back after a reload.
---

# Persistence

`CLAUDE.md` invariant: open sheets persist in IndexedDB, **every mutating action
writes through immediately**, and **spelling flags are never stored** — they are
recomputed on load.

## Files

| file                                             | role                                                      |
| ------------------------------------------------ | --------------------------------------------------------- |
| `src/lib/persistence/store.ts`                   | `WorkbookStore`: the `idb` database, load / save / remove |
| `src/lib/persistence/persistence.ts`             | `Persistence`: write-through calls with one error notice  |
| `src/lib/workbook/sheet.svelte.ts`               | `SheetRecord`, `toRecord()`, `Sheet.fromRecord()`         |
| `src/lib/workbook/workbook.svelte.ts`            | `WorkbookRecord`, `toRecord()`, `restore()`               |
| `src/routes/+page.svelte`                        | restore on mount; write-through at each action            |
| `src/tests/lib/persistence/store.svelte.test.ts` | round trips against the browser's real IndexedDB          |

## Database `csv-spell-checker`, version 1

| store      | key       | value                                                                                                              |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `sheets`   | `id`      | `SheetRecord` — name, source file, phase, languages, ignore list, per-cell dismissals, edit overrides, edited keys |
| `rows`     | `id`      | the parsed cells. Large, so written **once**, when parsing ends                                                    |
| `workbook` | `'state'` | tab order, active tab id, upload counter                                                                           |

Edits never rewrite `rows`: a cell edit updates the small `sheets` record
(`overrides` holds `[cellKey, value]` pairs), and the grid state is the parsed
rows with the overrides applied.

## Stored vs derived

Stored: everything the user chose or changed. **Never stored:** spelling flags,
check state, the current issue, undo/redo history. After loading, every `ready`
sheet is sent to the worker for a full check, so stored and derived data cannot
disagree. A sheet still parsing is not stored (`toRecord()` returns null); a
sheet waiting for language confirmation is, and reopens on that screen.

Records must be structured-cloneable: snapshot `$state` proxies with
`$state.snapshot` and copy Svelte collections into arrays.

## Write-through call sites

Every action that changes stored data calls `Persistence` in the same handler:

| action                     | call                          |
| -------------------------- | ----------------------------- |
| a sheet finishes parsing   | `sheetAdded(sheet, workbook)` |
| confirm languages          | `sheetChanged(sheet)`         |
| edit, undo, redo           | `sheetChanged(sheet)`         |
| rename, ignore-list change | `sheetChanged(sheet)`         |
| dismiss one occurrence     | `sheetChanged(sheet)`         |
| switch tab                 | `workbookChanged(workbook)`   |
| close tab                  | `sheetRemoved(id, workbook)`  |

`dismissedWords` holds instance ignores as `row:column:wordKey` keys, separate
from the sheet-wide `ignoredWords`; records written before it existed load with
`?? []`, so no database version bump was needed.

Adding a new user-changeable field means: add it to `SheetRecord`, read it in
`fromRecord` (with a default for records saved before it existed — the schema is
not versioned per field), and call `sheetChanged` wherever it changes.

Writes are fire-and-forget in call order; a failure logs with `console.error`
and shows one toast per session.

A tab can be closed while its file is still parsing or its language is being
detected, both of which take seconds. `importer.ts` checks `workbook.has(id)`
after each of those awaits and drops the sheet if it has gone: reporting it
would call `sheetAdded` **after** `sheetRemoved`, leaving records the close had
just deleted — and `load()` brings back any sheet that has a record, so the
closed tab reappeared on the next reload.

## Restore

`+page.svelte` loads on mount, rebuilds sheets with `Sheet.fromRecord`, and
`Workbook.restore` puts them ahead of anything opened meanwhile, reselecting the
saved active tab. The empty state is not rendered until restore finishes, so it
does not flash for returning users.
