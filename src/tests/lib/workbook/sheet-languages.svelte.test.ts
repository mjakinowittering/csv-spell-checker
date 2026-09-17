import { describe, expect, it } from 'vitest';

import type { ColumnLanguage } from '$lib/languages/codes';
import { Sheet } from '$lib/workbook/sheet.svelte';

function confirmed(languages: ColumnLanguage[]): Sheet {
    const sheet = new Sheet('Sheet 1');
    sheet.rows = [languages.map((_, index) => `Column ${index}`)];
    sheet.phase = {
        kind: 'confirming',
        guess: {
            detected: 'en',
            prefill: 'en-GB',
            confidence: 1,
            confident: true,
            source: 'franc'
        }
    };
    sheet.confirmLanguages(languages);
    return sheet;
}

describe('Sheet languages', () => {
    it('lists each checked language once, in column order', () => {
        const sheet = confirmed(['fr', 'none', 'en-GB', 'fr', 'unsupported']);
        expect(sheet.checkedLanguages).toEqual(['fr', 'en-GB']);
        expect(sheet.sheetLanguage).toBeNull();
    });

    it('has no checked languages before confirmation or when nothing is checked', () => {
        expect(new Sheet('Sheet 1').checkedLanguages).toEqual([]);
        expect(confirmed(['none', 'unsupported']).checkedLanguages).toEqual([]);
    });

    it('records the sheet-wide language when every column shares one', () => {
        const sheet = confirmed(['es', 'es']);
        expect(sheet.sheetLanguage).toBe('es');
        expect(sheet.checkedLanguages).toEqual(['es']);
    });

    it('never persists the selected cell', () => {
        const sheet = confirmed(['es']);
        sheet.selectedCell = { row: 1, column: 0 };
        expect(sheet.toRecord()).not.toHaveProperty('selectedCell');
    });
});

describe('Sheet cell languages', () => {
    const flag = {
        row: 1,
        column: 0,
        text: 'Sehr chłonna Windel',
        ranges: [{ start: 5, end: 12, suggestions: [] }]
    };

    it('falls back to the column language until a check says otherwise', () => {
        const sheet = confirmed(['de', 'none']);
        expect(sheet.cellLanguages(1, 0)).toEqual(['de']);
        // An unchecked column has no language to show.
        expect(sheet.cellLanguages(1, 1)).toEqual([]);
    });

    it('lists what a full check matched, most words first', () => {
        const sheet = confirmed(['de']);
        sheet.rows = [['Beschreibung'], [flag.text]];
        sheet.beginCheck();
        sheet.applySheetFlags(
            [],
            [
                {
                    row: 1,
                    column: 0,
                    counts: [
                        ['de', 2],
                        ['pl', 1]
                    ]
                }
            ]
        );

        expect(sheet.cellLanguages(1, 0)).toEqual(['de', 'pl']);
        // Cells the check did not report keep their column's language.
        expect(sheet.cellLanguages(2, 0)).toEqual(['de']);
    });

    it('updates one cell from its own re-check, and clears a single match', () => {
        const sheet = confirmed(['de']);
        sheet.rows = [['Beschreibung'], [flag.text]];
        sheet.beginCheck();
        sheet.applySheetFlags(
            [],
            [
                {
                    row: 1,
                    column: 0,
                    counts: [
                        ['de', 2],
                        ['pl', 1]
                    ]
                }
            ]
        );

        sheet.applyCellFlags({ ...flag, ranges: [] }, [
            ['pl', 2],
            ['de', 1]
        ]);
        expect(sheet.cellLanguages(1, 0)).toEqual(['pl', 'de']);

        sheet.applyCellFlags({ ...flag, ranges: [] }, [['de', 3]]);
        expect(sheet.cellLanguages(1, 0)).toEqual(['de']);
    });
});
