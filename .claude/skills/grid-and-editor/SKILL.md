---
name: grid-and-editor
description: The SVAR Svelte Data Grid spreadsheet view and the cell edit dialog — lettered columns and numbered rows, the frozen bold header row, custom cell components and their shared context, click-to-edit through the modal, the permanent edited tint, and per-sheet undo/redo. Load when working on the grid's look or behaviour, cell rendering, the edit dialog, edit history, or keyboard shortcuts for editing.
---

# Grid and cell editor

`CLAUDE.md` invariants that apply here: **cells are read-only at rest** and every
edit goes through the centred modal; **edited state is permanent**, shown green
only while the cell has no issues (a flagged cell's red ring always wins);
**Grammarly is blocked unless allowed**; **after an edit only that cell is
re-checked**.

## Files

| file                                             | role                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `src/lib/components/grid/SheetGrid.svelte`       | SVAR `Grid` config, theme bridge, click delegation            |
| `src/lib/components/grid/grid-context.ts`        | context for cell components, grid column ids                  |
| `src/lib/components/grid/DataCell.svelte`        | body cell: current value, edited tint                         |
| `src/lib/components/grid/HeaderValueCell.svelte` | CSV header cell (spreadsheet row 1), bold                     |
| `src/lib/components/grid/RowNumberCell.svelte`   | frozen row-number column                                      |
| `src/lib/components/grid/CellEditor.svelte`      | the edit dialog                                               |
| `src/lib/workbook/sheet.svelte.ts`               | `cellValue`, `editCell`, `undo`, `redo`, `edited`, `snapshot` |
| `src/lib/workbook/history.svelte.ts`             | undo/redo stacks                                              |
| `src/lib/grid/coordinates.ts`                    | `columnLetter`, `cellReference` (A1 notation)                 |

## Layout and coordinates

- Grid header row 1 shows column letters (A, B, … Z, AA).
- Grid header row 2 is the **CSV header row** (sheet row 0), shown bold and frozen
  because the grid never scrolls its header. Spreadsheet row number: **1**.
- Body rows are sheet rows 1…n, grid row id = sheet row index, shown as rows 2…n+1.
- Column 0 of the grid is the frozen row-number column (`split: { left: 1 }`).
- `cellReference(row, column)` turns sheet indexes into A1 notation; the header
  row is row 1, so the dialog says "Editing B3" for sheet row 2, column 1.

## State lives in the sheet, not the grid

The grid only receives `{ id }` rows and column configs. Cell components read
`sheet.cellValue()` / `sheet.isEdited()` through `getGridContext()`. The parsed
`rows` array is never mutated; edits go into a `SvelteMap` of overrides, so an
edit re-renders one cell and never reinitialises the grid (which would reset
scroll). `snapshot()` merges overrides for export.

## Editing

- Clicks are delegated from the grid container: any element carrying
  `data-sheet-row` / `data-sheet-column` opens the editor. Cell components fill
  the whole cell so a click anywhere in it counts. Enter on a focused cell opens
  the editor too. No buttons or inputs live inside cells.
- `CellEditor` is mounted fresh per edit (so its draft starts from the current
  value) and is always `open`; any dismissal — overlay click, Escape, the X,
  Cancel — calls `oncancel` and saves nothing. Confirm (or Ctrl/Cmd+Enter)
  commits.
- The textarea sets `lang` to the column's language (omitted for None and
  Unsupported) and `spellcheck`, so native spellcheck works while typing.
- Grammarly: `grammarlyAttributes(allowed)` (`src/lib/editor/grammarly.ts`)
  spreads `data-gramm`, `data-gramm_editor` and `data-enable-grammarly` = `false`
  onto the textarea unless the footer's "Allow Grammarly" `Switch` is on. The
  choice is `grammarlyPreference.allowed` (`grammarly-preference.svelte.ts`), a
  device preference in localStorage, not part of any sheet.
- The dialog header carries `LanguageFlags` for
  `sheet.cellLanguages(row, column)`: one flag, or a stack when the cell's
  words matched several languages, most words first.
- Below the textarea, `CellIssueList` lists the cell's flagged words
  (`sheet.cellIssues`) under "Issues in this cell:" as `word → suggestion` rows
  (`WordSuggestion`). Capitalisations share one row ("Trés" and "trés"), and
  each row has three actions:
    - **Fix** rewrites the word in the draft only — every spelling, each with
      its own case-matched suggestion (`replaceWord` with `issueReplacement`)
      — then hides the row; Confirm saves it like any edit. Disabled when
      Hunspell has no suggestion for any spelling.
    - **Ignore** is the instance scope: `sheet.dismissWord(row, column, word)`
      drops that word in that cell only.
    - **Ignore All** is the sheet scope (see the spellcheck-worker skill).

    The dialog stays open for all three. Rows are deliberately roomy
    (`text-sm/6`, `py-2`): a tight line box clips the wavy underline.

- Undo history is a stack of **steps** (`EditStep`, an array of `CellEdit`s).
  A manual edit is a one-edit step; a sheet-wide `fixWord` is one step holding
  every cell it rewrote, so one Undo reverts it all. The page re-checks one
  cell after undoing a single edit, or the whole sheet after a multi-cell step.
- `editCell` returns `null` for an unchanged value: no tint, no history entry.
- Undo/redo: toolbar buttons and Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y — ignored
  while focus is in an editable element or the dialog is open. Undo restores the
  value; the tint stays.

## Opening a sheet

`initGrid` focuses the first data cell a frame after the grid renders, so the
arrow keys move around immediately. The grid only focuses body cells, so this
is spreadsheet row 2 (sheet row 1) — the CSV header row cannot take focus.

## Styling

`SheetGrid` maps the Willow theme's `--wx-*` variables onto the shadcn tokens so
the grid follows light/dark with the rest of the app, and passes `fonts={false}`
(no CDN fonts). Letter and row-number cells use the muted surface.

Cell state classes live once in `layout.css` so the status bar legend shows the
same swatches. `SheetCellText` applies them with a fixed precedence:

1. Flagged (`sheet-cell-flagged` ring + `sheet-misspelling` squiggles) always
   shows, edited or not.
2. `sheet-cell-edited` (green tint and 1px border) only when the cell is edited
   **and** has no flags. Every edited cell also carries `data-edited`, whatever
   its flag state.
3. `sheet-cell-current` (primary ring) combines with either.
