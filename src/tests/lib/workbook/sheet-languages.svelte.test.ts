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
