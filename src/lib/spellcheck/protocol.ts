import type { ColumnLanguage, LanguageCode } from '$lib/languages/codes';

import type { MisspellingRange } from './tokenize';

/** The misspellings found in one cell, with the exact text that was checked. */
export type CellFlags = {
    row: number;
    column: number;
    text: string;
    ranges: MisspellingRange[];
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
      }
    /** Re-check one cell after an edit, undo or redo. */
    | {
          type: 'check-cell';
          sheetId: string;
          row: number;
          column: number;
          text: string;
          language: ColumnLanguage;
      };

export type SpellcheckResponse =
    | { type: 'sheet-progress'; sheetId: string; fraction: number }
    /** Only cells with at least one misspelling are listed. */
    | { type: 'sheet-result'; sheetId: string; flags: CellFlags[] }
    /** `ranges` is empty when the cell is now spelled correctly. */
    | { type: 'cell-result'; sheetId: string; cell: CellFlags }
    | { type: 'dictionary-error'; sheetId: string; language: LanguageCode };
