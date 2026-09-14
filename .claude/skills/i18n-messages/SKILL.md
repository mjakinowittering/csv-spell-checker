---
name: i18n-messages
description: Authoring Paraglide message keys in `messages/en.json` — key prefixes for this app's areas, suffix families and their length register, parameters, and the recompile step. Load when adding or editing any UI string, naming a message key, or writing label/hint/title/description/error copy. English is the only locale.
---

# Paraglide messages

All UI copy lives in `messages/en.json` and is rendered through
`m.<key>()` from `$lib/paraglide/messages`. The point is not translation — the app
ships English only (`locales: ["en"]`, no switcher) — it is keeping copy out of
markup, in one place, consistent in tone and length.

Error text and toast text go through messages too. Language names shown in the
UI are messages; the language _codes_ are not.

## Voice

The user is checking the text in a spreadsheet, not operating a spellchecker.

- Plain words: "Checking spelling…", never "Worker busy" or "Hunspell loaded".
- Never name implementation details in the UI: no "Franc", "Typo.js", "worker",
  "dictionary file", "TSV".
- Errors say what happened and what to do, in one sentence, without apology or
  codes: "This file isn't a CSV. Save it as CSV and upload it again."

## Key naming

`snake_case`, `<area>_<context>_<element>`. Reuse an existing prefix; grep before
inventing a new one.

| prefix        | covers                                                |
| ------------- | ----------------------------------------------------- |
| `app_`        | app-wide strings (title)                              |
| `toolbar_`    | the top toolbar                                       |
| `theme_`      | the theme toggle                                      |
| `tabs_`       | the sheet tab strip and its plus menu                 |
| `status_`     | the status bar                                        |
| `empty_`      | the first-run empty state                             |
| `import_`     | upload, drag-drop, paste, parsing progress and errors |
| `languages_`  | language names and the per-column confirmation screen |
| `grid_`       | the spreadsheet grid                                  |
| `editor_`     | the cell edit dialog                                  |
| `spellcheck_` | background check progress and results                 |
| `export_`     | CSV download                                          |

## Suffix families

The last segment declares the family, and the family sets the length:

| suffix         | register                                        |
| -------------- | ----------------------------------------------- |
| `_hint`        | tooltip: a short noun phrase or verb, 1–3 words |
| `_label`       | accessible name / field label, 1–3 words        |
| `_title`       | heading, a few words, no full stop              |
| `_description` | one or two sentences, ends with a full stop     |
| `_error`       | one plain sentence saying what to do            |
| `_action`      | button text, a verb phrase, 1–3 words           |
| `_count`       | a short phrase with a `{count}` parameter       |

Before writing a value, read the siblings that share the suffix (and ideally the
prefix) and match their length. A tooltip that runs to a sentence, or a
description that is two words, is wrong even if the English is fine.

## Parameters

Interpolate with `{name}`:

```json
"tabs_close_label": "Close {name}",
"status_rows": "Rows: {count}"
```

A parameter carries a value the app already has (a name, a number). Do not build
English phrases in code and interpolate them — pass the parts, let the key own the
words.

## Workflow

1. Grep `messages/en.json` for the prefix and suffix family.
2. Add the key beside its prefix neighbours.
3. Recompile before type-checking (svelte-check does not run the Vite plugin):
   `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide`
4. Reference it as `m.<key>()` — never a raw string in markup.
5. A key nothing references is deleted in the same commit that stopped using it.

`src/lib/paraglide/` is generated and gitignored; CI compiles it before checking.
