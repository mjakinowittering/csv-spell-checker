# CLAUDE.md

This file defines the conventions, patterns, and architecture for the CSV Spell Checker PWA. Follow it precisely. When a domain skill in .claude/skills/ contradicts a stale line here, the skill is the more detailed source of truth — but the General Rules below always hold regardless of which skill is loaded.

## Project Goal

A browser-based PWA for uploading or pasting CSV/spreadsheet data and spell-checking it, combining native browser spellcheck (while editing) with a persistent background Hunspell-based check (at rest). CSV only, no XLS/XLSX. Chrome is the primary target, Safari is a bonus. Deployed as a static SPA to GitHub Pages.

## Tech Stack

- SvelteKit (static adapter, SPA mode for GitHub Pages)
- shadcn-svelte, Vega style
- Tailwind v4
- SVAR Svelte Data Grid, with custom Svelte cell editor components
- hunspell-wasm (Hunspell compiled to WebAssembly, with the `dictionary-*` Hunspell dictionaries) for background spellcheck, run inside a Web Worker
- Chrome's built-in Language Detector API for language detection, with Franc as the fallback (sampled per sheet, confirmed by user)
- mode-watcher style theming, defaults to OS-level prefers-color-scheme

## Skills Index

Load the relevant skill file when working in that domain. Skills defer to this file for shared invariants and only add domain-specific depth on top.

| Domain            | Skill file                                | Load when working on...                       |
| ----------------- | ----------------------------------------- | --------------------------------------------- |
| Process           | .claude/skills/todo-review/SKILL.md       | Triaging README Todo backlog                  |
| Process           | .claude/skills/branch-and-commit/SKILL.md | Branching, committing, PRs                    |
| CSV/paste parsing | .claude/skills/csv-parsing/SKILL.md       | Upload, paste, parser edge cases              |
| Spellcheck worker | .claude/skills/spellcheck-worker/SKILL.md | Web Worker, hunspell-wasm, language detection |
| Grid/editor       | .claude/skills/grid-and-editor/SKILL.md   | SVAR grid, cell modal, edit history           |
| UI components     | .claude/skills/ui-components/SKILL.md     | shadcn-svelte usage, theming                  |
| Persistence       | .claude/skills/persistence/SKILL.md       | IndexedDB storage, restoring sheets           |

(Domain skill files beyond todo-review and branch-and-commit are stubs to be filled in as each area is built.)

## General Rules

- CSV only. Never add XLS/XLSX support.
- Cells are read-only at rest. All editing happens through the centered modal dialog, never inline.
- Paste always creates a new sheet. Never merges into or targets existing cells.
- Full-sheet spellcheck runs in a Web Worker, never on the main thread.
- After an edit, only the edited cell is re-checked, not the whole sheet. The exceptions are sheet-wide actions (ignoring a word, fixing a word everywhere, and undoing or redoing such a fix), which re-check the whole sheet in the worker.
- hunspell-wasm is the only spellcheck engine (Typo.js is gone). Every flagged word carries Hunspell's suggestions (top one plus up to two runners-up) in both `sheet-result` and `cell-result`.
- Suggestions and fixes live only in the cell editor's issues list and the sheet-wide flagged-words dialog, as `word → suggestion` rows. No live squiggles inside the editor textarea and no hover cards over text.
- Different capitalisations of a flagged word ("Trés", "trés") are one issue row in both the editor and the dialog, and Fix always preserves each occurrence's case (its own suggestion, or the word's suggestion with the first letter's case matched).
- In the cell editor, Fix rewrites that word in the draft only (whole-word matches); like typing, it is saved by Confirm. Ignore still applies sheet-wide immediately.
- In the flagged-words dialog, Fix rewrites every flagged occurrence of that word across the sheet immediately (whole words from the check, never substrings; each occurrence takes its own top suggestion). Every affected cell is marked edited, the whole fix is a single undo step (one Undo reverts all of it), the sheet is persisted, and the sheet is re-checked.
- Edited state is permanent (undo keeps it). An edited cell with no spelling issues shows a green tint and border; a flagged cell always shows its red ring and squiggles instead, edited or not.
- Grammarly is blocked in the cell editor (`data-gramm`, `data-gramm_editor`, `data-enable-grammarly` set to `false`) unless the user turns on the editor's "Allow Grammarly" switch; that choice is remembered per device in localStorage.
- Flagged cells show a squiggly underline plus a ring highlight, and this persists after blur.
- Ignoring a flagged word (from the cell editor's chips or the toolbar's flagged-words dialog) applies to the whole sheet, case-insensitively. It is persisted with the sheet and followed by a full re-check in the worker.
- Language detection runs once per new sheet (upload or paste) on the main thread during the loading step, never in the spellcheck worker. It uses Chrome's `LanguageDetector` when `'LanguageDetector' in self` and its model is available, and Franc otherwise. It samples only the first 10 non-header rows across all columns combined and produces a single sheet-wide guess.
- Below the confidence threshold (built-in score under 0.7; for Franc, under 100 letters or a top-two score gap under 0.04) nothing is pre-filled and the user must choose.
- The user must confirm the sheet's language (with optional per-column overrides) before spellcheck starts, every time, no shortcuts.
- Supported languages: English UK, English US, French, German, Italian, Spanish, Portuguese (Portugal), Portuguese (Brazil), Dutch, Polish, Swedish, Danish, Norwegian (Bokmål), Czech. No others.
- A confidently detected language outside the supported list is pre-filled as "Unsupported, not spell-checked", styled differently from None. The worker skips those columns.
- No `any` in TypeScript.
- No `console.log`; `console.error` only.
- All UI copy through shadcn-svelte components; no ad hoc HTML form elements.
- Every component in `src/lib/components/` (outside `ui/`) has a colocated `*.stories.svelte`. Stories run as tests in both light and dark themes, and an accessibility violation fails the run.
- Theme defaults to OS-level prefers-color-scheme on first load; manual toggle always available.
- Status bar is informational only (row count, the selected cell and its column's language); never shows edited-cell counts. It is hidden when no sheet is open; the tab strip and status bar stay anchored at the bottom.
- Tabs are renamed from their right-click menu (or F2 on a focused tab) through an inline field: Enter or blur saves, Escape cancels, a blank name is ignored. Names persist.
- A ready sheet's spell-check languages are always visible: flag and code in the toolbar (stacked flags for mixed sheets) and a flag before its tab name.
- Open sheets persist in IndexedDB (via `idb`): cells and edits, name, languages and ignore list. Every action that changes them writes through immediately — never on a timer or on unload. Spelling flags are never stored; they are recomputed by the worker whenever a sheet is loaded.
