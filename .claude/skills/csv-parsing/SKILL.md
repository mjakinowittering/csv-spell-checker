---
name: csv-parsing
description: CSV upload, drag-drop, clipboard paste and parsing — the RFC 4180 parser, the parse worker and its message protocol, sheet naming, and how a new tab is created before parsing finishes. Load when working on upload or paste entry points, the parser or its edge cases, parse progress, CSV validation, or CSV export serialisation.
---

# CSV parsing and import

`CLAUDE.md` invariants that apply here: **CSV only** (never XLS/XLSX), and **paste
always creates a new sheet** — never merges into or targets existing cells.

## Files

| file                              | role                                                     |
| --------------------------------- | -------------------------------------------------------- |
| `src/lib/csv/parse.ts`            | pure parser (`parseDelimited`, `detectDelimiter`)        |
| `src/lib/csv/protocol.ts`         | worker request / response types                          |
| `src/lib/csv/parse.worker.ts`     | reads the `File` and parses off the main thread          |
| `src/lib/csv/parser.ts`           | main-thread client: one lazy worker, id-matched promises |
| `src/lib/workbook/importer.ts`    | validation, naming, opening the tab, progress, toasts    |
| `src/tests/lib/csv/parse.test.ts` | parser cases                                             |

## Flow

1. An entry point hands `File`s to `importFiles` or text to `importPastedText`.
2. Non-CSV files are refused with a toast and get no tab. A file counts as CSV if
   its name ends in `.csv` or its MIME type is `text/csv`.
3. A `Sheet` is created and **opened immediately**, in `phase: parsing`, so the tab
   exists before any parsing happens.
4. The worker posts `progress` fractions, then `done` with `string[][]` or `error`.
5. Empty results and errors close the tab and show a toast. Otherwise `rows` is
   set and the sheet moves to the next phase.

## Entry points

- Toolbar upload button, the tab strip's plus menu, and the empty state's upload
  button all open the same hidden shadcn `Input type="file"` (`multiple`,
  `accept=".csv,text/csv"`).
- Dropping files anywhere on the page.
- A `paste` event anywhere on the page, **unless** focus is in an editable
  element (the cell editor's textarea must keep native paste).
- The plus menu's "Paste from clipboard" uses `navigator.clipboard.readText()`;
  if the browser refuses, a toast tells the user to press Ctrl+V.

## Naming

- Uploads: `Sheet N`, with `N` from `Workbook.nextUploadNumber()` — a session
  counter that never reuses a number, even after tabs close.
- Pastes: `Pasted sheet` plus the local time with seconds.

## Parser rules

- Delimiter: pasted text is always tab. Files use `detectDelimiter` on the first
  line outside quotes — comma, semicolon or tab, defaulting to comma.
- A quote only opens a quoted field at the start of a field; `""` inside a quoted
  field is a literal quote; quoted fields may span lines.
- CRLF, LF and CR all end a row. A leading BOM is dropped.
- Trailing empty lines are dropped; empty rows between data rows are kept.
- Rows are padded to the widest row so every column exists in every row.
- Row 0 is the header row. It is data like any other cell (editable, checked),
  displayed as a bold frozen first row.

Every rule above has a case in `parse.test.ts`; add one with any change.

## Export

The toolbar's download button exports the active sheet:
`serializeCsv(sheet.snapshot())` in `src/lib/csv/serialize.ts`, saved by
`downloadCsv` in `src/lib/csv/download.ts`.

- Always comma separated with CRLF line endings, whatever delimiter the upload
  used. Fields are quoted only when they contain a comma, quote or line break, or
  start or end with whitespace; embedded quotes are doubled.
- The file starts with a UTF-8 byte-order mark so Excel reads accented letters
  correctly. The parser drops it again on re-upload.
- `snapshot()` applies every edit; the parsed `rows` are never mutated.
- Uploads keep their original file name (`Sheet.sourceFileName`); pasted sheets
  use the tab name with file-system-unsafe characters (the time's colons)
  replaced.
- Round trip: parsing the export gives back the same cells. The one exception is
  a trailing row whose cells are all empty, which the parser drops as a blank
  line. `serialize.test.ts` covers the round trip.
