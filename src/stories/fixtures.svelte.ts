// Sample data for stories. Stories never load a dictionary or a worker: a
// handful of known misspellings stand in for the spellcheck result.

import type { ColumnLanguage } from '$lib/languages/codes';
import type { LanguageGuess } from '$lib/languages/detect';
import type { CellFlags } from '$lib/spellcheck/protocol';
import { findMisspellings } from '$lib/spellcheck/tokenize';
import { Sheet } from '$lib/workbook/sheet.svelte';

const MISSPELLED = new Set(['hikking', 'recieve', 'adress', 'teh', 'chiar']);

export const confidentGuess: LanguageGuess = {
    detected: 'en',
    prefill: 'en-GB',
    confidence: 0.94,
    confident: true,
    source: 'built-in'
};

export const lowConfidenceGuess: LanguageGuess = {
    detected: 'fr',
    prefill: null,
    confidence: 0.03,
    confident: false,
    source: 'franc'
};

export const unsupportedGuess: LanguageGuess = {
    detected: 'pl',
    prefill: 'unsupported',
    confidence: 0.91,
    confident: true,
    source: 'built-in'
};

export const sampleRows: string[][] = [
    ['Name', 'Bio', 'Notes'],
    ['Sarah', 'Loves hikking and coffee', 'Recieve parcels at the side door'],
    ['Tom', 'Enjoys long walks', 'New adress from March'],
    ['Priya', 'Reads every evening', 'Prefers email'],
    ['Leo', 'Plays the piano', 'Sits in teh oak chiar']
];

export type StorySheetOptions = {
    name?: string;
    rows?: string[][];
    phase?: 'parsing' | 'confirming' | 'ready';
    /** One per column; English (UK) throughout by default. */
    languages?: ColumnLanguage[];
    /** Edits applied after confirmation, as `[row, column, value]`. */
    edits?: [number, number, string][];
    /** Flag the stand-in misspellings. On by default. */
    flagged?: boolean;
};

/** A sheet in any phase, with edits and flags, built without a worker. */
export function storySheet(options: StorySheetOptions = {}): Sheet {
    const rows = options.rows ?? sampleRows;
    const sheet = new Sheet(options.name ?? 'Sheet 1');
    if (options.phase === 'parsing') {
        sheet.phase = { kind: 'parsing', progress: 0.4 };
        return sheet;
    }
    sheet.rows = rows;
    sheet.phase = { kind: 'confirming', guess: confidentGuess };
    if (options.phase === 'confirming') return sheet;

    sheet.confirmLanguages(options.languages ?? rows[0].map(() => 'en-GB'));
    for (const [row, column, value] of options.edits ?? []) {
        sheet.editCell(row, column, value);
    }
    if (options.flagged ?? true) applyStoryFlags(sheet);
    return sheet;
}

/** Flag the stand-in misspellings in every cell, as a full check would. */
export function applyStoryFlags(sheet: Sheet) {
    const check = (word: string) => !MISSPELLED.has(word.toLowerCase());
    const flags: CellFlags[] = sheet.snapshot().flatMap((cells, row) =>
        cells.flatMap((text, column) => {
            const ranges = findMisspellings(text, check);
            return ranges.length > 0 ? [{ row, column, text, ranges }] : [];
        })
    );
    sheet.beginCheck();
    sheet.applySheetFlags(flags);
}
