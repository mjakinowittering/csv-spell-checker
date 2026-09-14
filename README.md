# CSV Spell Checker

A browser-based PWA for uploading or pasting CSV data and spell-checking it.
Native browser spellcheck works while you edit a cell. A background Hunspell
check flags misspellings across the whole sheet at rest. CSV only.

Supported languages: English (UK), English (US), French, German, Italian,
Spanish.

## Developing

```sh
npm install
npm run dev
```

| Script          | Does                         |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the dev server         |
| `npm run build` | Build the static site        |
| `npm run check` | Type-check with svelte-check |
| `npm run lint`  | Prettier and ESLint          |
| `npm run test`  | Run the Vitest suites once   |

Deployed as a static SPA to GitHub Pages.

## Todo

### Bugs

_No open bugs._

### Features

#### Shell

- [x] **App shell** — toolbar (app icon, undo/redo, spelling-issues counter with next/previous, download, upload), closable sheet tabs with a plus button above a row-count status bar, and OS-default theme with a manual toggle.
- [x] **First-run empty state** — explains the app's purpose, shows the upload → grid → flagged errors flow, and lists the supported languages as chips.

#### Import

- [ ] **CSV upload and paste** — drag-drop or browse a CSV, or paste tab-separated content; each opens a new "Sheet N" or "Pasted sheet" tab with a bold frozen header row and a parsing progress indicator.
- [x] **Language detection and confirmation** — Franc samples the first 10 non-header rows for one sheet-wide guess that pre-fills a per-column language screen, with low-confidence warnings, shown for every new sheet.

#### Grid

- [ ] **Spreadsheet grid and cell editor** — SVAR data grid with lettered columns and numbered rows, read-only cells that open a spellcheck-enabled modal editor, a permanent tint on edited cells, and undo/redo.

#### Spellcheck

- [ ] **Spellcheck worker** — a Web Worker checks every non-ignored column with Typo.js Hunspell dictionaries, flags cells with a squiggly underline and ring, and re-checks only the edited cell after a change.
- [ ] **Spelling-issue navigation** — the toolbar counter shows the issue count and next/previous jumps between flagged cells.

#### Export

- [ ] **CSV export** — the download button saves the active sheet as a CSV file.
