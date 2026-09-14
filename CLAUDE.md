# CLAUDE.md

This file defines the conventions, patterns, and architecture for the CSV Spell Checker PWA. Follow it precisely. When a domain skill in .claude/skills/ contradicts a stale line here, the skill is the more detailed source of truth — but the General Rules below always hold regardless of which skill is loaded.

## Project Goal

A browser-based PWA for uploading or pasting CSV/spreadsheet data and spell-checking it, combining native browser spellcheck (while editing) with a persistent background Hunspell-based check (at rest). CSV only, no XLS/XLSX. Chrome is the primary target, Safari is a bonus. Deployed as a static SPA to GitHub Pages.

## Tech Stack

- SvelteKit (static adapter, SPA mode for GitHub Pages)
- shadcn-svelte, Vega style
- Tailwind v4
- SVAR Svelte Data Grid, with custom Svelte cell editor components
- Typo.js (Hunspell dictionaries) for background spellcheck, run inside a Web Worker
- Franc for language detection (sampled per sheet, confirmed by user)
- mode-watcher style theming, defaults to OS-level prefers-color-scheme

## Skills Index

Load the relevant skill file when working in that domain. Skills defer to this file for shared invariants and only add domain-specific depth on top.

| Domain            | Skill file                                | Load when working on...                |
| ----------------- | ----------------------------------------- | -------------------------------------- |
| Process           | .claude/skills/todo-review/SKILL.md       | Triaging README Todo backlog           |
| Process           | .claude/skills/branch-and-commit/SKILL.md | Branching, committing, PRs             |
| CSV/paste parsing | .claude/skills/csv-parsing/SKILL.md       | Upload, paste, parser edge cases       |
| Spellcheck worker | .claude/skills/spellcheck-worker/SKILL.md | Web Worker, Typo.js, Franc integration |
| Grid/editor       | .claude/skills/grid-and-editor/SKILL.md   | SVAR grid, cell modal, edit history    |
| UI components     | .claude/skills/ui-components/SKILL.md     | shadcn-svelte usage, theming           |

(Domain skill files beyond todo-review and branch-and-commit are stubs to be filled in as each area is built.)

## General Rules

- CSV only. Never add XLS/XLSX support.
- Cells are read-only at rest. All editing happens through the centered modal dialog, never inline.
- Paste always creates a new sheet. Never merges into or targets existing cells.
- Full-sheet spellcheck runs in a Web Worker, never on the main thread.
- After an edit, only the edited cell is re-checked, not the whole sheet.
- Edited cells keep a permanent visual tint, independent of error state.
- Flagged cells show a squiggly underline plus a ring highlight, and this persists after blur.
- Language detection runs once per new sheet (upload or paste) via Franc, sampling only the first 10 non-header rows across all columns combined, producing a single sheet-wide guess that pre-fills every column's dropdown.
- The user must confirm languages per column before spellcheck starts, every time, no shortcuts.
- Supported languages: English UK, English US, French, German, Italian, Spanish. No others.
- No `any` in TypeScript.
- No `console.log`; `console.error` only.
- All UI copy through shadcn-svelte components; no ad hoc HTML form elements.
- Theme defaults to OS-level prefers-color-scheme on first load; manual toggle always available.
- Status bar is informational only (e.g. row count); never shows edited-cell counts.
