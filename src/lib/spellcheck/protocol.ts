import type { ColumnLanguage, LanguageCode } from '$lib/languages/codes';

import type { MisspellingRange } from './tokenize';

/** A misspelled word's position and Hunspell's suggestions, best first. */
export type WordFlag = MisspellingRange & {
    /** At most `MAX_SUGGESTIONS`; empty when Hunspell has none. */
    suggestions: string[];
};

/** The top suggestion plus a couple of runners-up. */
export const MAX_SUGGESTIONS = 3;

/**
 * How many of a cell's words each language matched, the language matching the
 * most first. Only sent for cells where a fallback language matched something,
 * so a cell without an entry was checked in its column's language alone.
 */
export type CellLanguages = {
    row: number;
    column: number;
    counts: [LanguageCode, number][];
};

/** The misspellings found in one cell, with the exact text that was checked. */
export type CellFlags = {
    row: number;
    column: number;
    text: string;
    ranges: WordFlag[];
};

export type SpellcheckRequest =
    /** Where dictionaries are served from: `<base>/<language>/index.aff`. */
    | { type: 'init'; dictionaryBase: string }
    /** Check every cell in columns set to a supported language. */
    | {
          type: 'check-sheet';
          sheetId: string;
          rows: string[][];
          languages: ColumnLanguage[];
          /** The sheet's ignore list, as `ignoreKey()` keys. */
          ignoredWords: string[];
      }
    /** Re-check one cell after an edit, undo or redo. */
    | {
          type: 'check-cell';
          sheetId: string;
          row: number;
          column: number;
          text: string;
          language: ColumnLanguage;
          ignoredWords: string[];
      };

export type SpellcheckResponse =
    | { type: 'sheet-progress'; sheetId: string; fraction: number }
    /** Only cells with at least one misspelling are listed. */
    | {
          type: 'sheet-result';
          sheetId: string;
          flags: CellFlags[];
          languages: CellLanguages[];
      }
    /** `ranges` is empty when the cell is now spelled correctly. */
    | {
          type: 'cell-result';
          sheetId: string;
          cell: CellFlags;
          languages: [LanguageCode, number][];
      }
    | { type: 'dictionary-error'; sheetId: string; language: LanguageCode };
