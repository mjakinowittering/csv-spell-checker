# CSV Spell Checker

A browser-based PWA for uploading or pasting CSV data and spell-checking it.
Native browser spellcheck works while you edit a cell. A background Hunspell
check flags misspellings across the whole sheet at rest. CSV only.

Supported languages: English (UK), English (US), French, German, Italian,
Spanish, Portuguese (Portugal), Portuguese (Brazil), Dutch, Polish, Swedish,
Danish, Norwegian (Bokmål), Czech.

## Developing

```sh
npm install
npm run dev
```

| Script                 | Does                                          |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the dev server                          |
| `npm run build`        | Build the static site                         |
| `npm run check`        | Type-check with svelte-check                  |
| `npm run lint`         | Prettier and ESLint                           |
| `npm run test`         | Run the Vitest suites once                    |
| `npm run dictionaries` | Copy the Hunspell dictionaries into `static/` |

Deployed as a static SPA to GitHub Pages.

## Dictionaries

Spellcheck uses the Hunspell dictionaries from the
[`dictionary-*`](https://github.com/wooorm/dictionaries) packages.
`npm run dictionaries` (run automatically before `dev` and `build`) copies them,
with their licence files, into `static/dictionaries/`, which is gitignored. The
built site serves them to the browser, so their licences apply to the deployed
app:

| Language              | Package            | Licence                      |
| --------------------- | ------------------ | ---------------------------- |
| English (UK)          | `dictionary-en-gb` | MIT and BSD                  |
| English (US)          | `dictionary-en`    | MIT and BSD                  |
| French                | `dictionary-fr`    | MPL-2.0                      |
| German                | `dictionary-de`    | GPL-2.0 or GPL-3.0           |
| Italian               | `dictionary-it`    | GPL-3.0                      |
| Spanish               | `dictionary-es`    | GPL-3.0, LGPL-3.0 or MPL-1.1 |
| Portuguese (Portugal) | `dictionary-pt-pt` | GPL-2.0, LGPL-2.1 or MPL-1.1 |
| Portuguese (Brazil)   | `dictionary-pt`    | LGPL-3.0 or MPL-2.0          |
| Dutch                 | `dictionary-nl`    | BSD-3-Clause or CC-BY-3.0    |
| Polish                | `dictionary-pl`    | GPL-3.0, LGPL-3.0 or MPL-2.0 |
| Swedish               | `dictionary-sv`    | LGPL-3.0                     |
| Danish                | `dictionary-da`    | GPL-2.0, LGPL-2.1 or MPL-1.1 |
| Norwegian (Bokmål)    | `dictionary-nb`    | GPL-2.0                      |
| Czech                 | `dictionary-cs`    | GPL-2.0                      |

Spellchecking runs on [`hunspell-wasm`](https://github.com/rotemdan/hunspell-wasm),
Hunspell compiled to WebAssembly (LGPL-2.0, GPL-2.0 or MPL-1.1).

## Todo

### Bugs

#### Grid

- [ ] **Grid accessibility violations from SVAR** — the grid's column-resize grips put `aria-label` on `role="presentation"`, and its first row gets `aria-rowindex="0"`. Both come from `wx-svelte-grid`'s own markup, so the `SheetGrid` stories switch those two axe rules off. Report upstream, or patch the markup after render, then re-enable the rules.

### Improvements

#### Import

- [ ] **Download Chrome's language model on a user gesture** — when Chrome's detector reports `downloadable`, creating it needs a recent click, which has usually expired by the time a file is parsed, so detection falls back to Franc. Start the model download from the upload/paste click instead, so later sheets get the built-in detector.
- [ ] **Smaller Franc fallback** — switch `franc` (245 KB, 117 KB gzipped, loaded only when Chrome's detector is unavailable) to `franc-min`, after checking it still covers every supported language and the unsupported ones worth naming. Short samples (two rows of French) currently fall just under Franc's confidence threshold.

#### Spellcheck

- [ ] **Flag capitalisation as its own kind of issue** — case no longer decides a spelling flag, so a German noun written in lower case in prose ("der hund läuft") passes silently. Add a separate capitalisation check, presented differently from a misspelling, and skippable for the keyword-style columns that are deliberately lower case.
- [ ] **A fuller German dictionary** — `dictionary-de` holds only ~76k entries and is missing ordinary words (Juckreiz, Läufigkeit, pinkeln, Zahnen, Streu, durchfeuchtet), which is what remains of the German false positives after the case and compound fixes. Consider LibreOffice's `de_DE_frami`, and record the licence and download size it brings.
- [ ] **Tune when a bulk fix warns** — a cell counts as mixed-language if any word matched a fallback, so one stray English brand word marks an otherwise-German cell as mixed and keeps it out of the safer "single-language cells" fix. Consider a share threshold, or comparing the cell's dominant language with its column's, instead.

#### Tooling

- [ ] **Quiet the build warnings** — `vite.config.ts` uses `__dirname`, which Vite's native config loader will not support (use `import.meta.dirname`), and the build notes that `hunspell-wasm`'s Node-only `fs/promises` and `module` imports are externalised (harmless in the browser).
- [ ] **Review the skills against the code** — check every skill in `.claude/skills/` against the current implementation and update stale details (files, APIs, behaviour); where the intended behaviour is unclear, run an interactive Q&A with the owner instead of guessing.

### New Features

#### Spellcheck

- [ ] **Change language from the toolbar flag** — clicking the active sheet's flag (or stacked flags) in the toolbar reopens its language choice (sheet-wide picker with per-column overrides) and re-checks the whole sheet with the new languages.

#### Tooling

- [ ] **End-to-end browser tests** — upload → confirm → check → edit → ignore → rename → reload → export have only been verified with throwaway Playwright scripts. Add them as a checked-in suite (against the dev server and the production build, where the worker's `.wasm` path differs).
