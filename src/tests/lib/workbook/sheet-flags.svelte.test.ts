import { describe, expect, it } from 'vitest';

import { Sheet } from '$lib/workbook/sheet.svelte';

function readySheet(): Sheet {
    const sheet = new Sheet('Sheet 1');
    sheet.rows = [
        ['Name', 'Bio'],
        ['Sarah', 'Loves hikking'],
        ['Priya', 'Recieves mail']
    ];
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
    sheet.confirmLanguages(['none', 'en-GB']);
    return sheet;
}

const hikking = {
    row: 1,
    column: 1,
    text: 'Loves hikking',
    ranges: [{ start: 6, end: 13, suggestions: ['hiking', 'hinging'] }]
};
const recieves = {
    row: 2,
    column: 1,
    text: 'Recieves mail',
    ranges: [{ start: 0, end: 8, suggestions: ['Receives'] }]
};

describe('Sheet spelling flags', () => {
    it('applies a full-sheet result and counts flagged cells', () => {
        const sheet = readySheet();
        sheet.beginCheck();
        expect(sheet.checkState).toBe('checking');

        sheet.applySheetFlags([recieves, hikking]);

        expect(sheet.checkState).toBe('done');
        expect(sheet.issueCount).toBe(2);
        expect(sheet.flagRanges(1, 1)).toEqual(hikking.ranges);
        expect(sheet.flaggedCells()).toEqual([
            { row: 1, column: 1 },
            { row: 2, column: 1 }
        ]);
    });

    it('ignores a result for text the cell no longer holds', () => {
        const sheet = readySheet();
        sheet.editCell(1, 1, 'Loves hiking');
        sheet.applyCellFlags(hikking);
        expect(sheet.flagRanges(1, 1)).toBeUndefined();
    });

    it('clears a cell flag when its re-check finds nothing', () => {
        const sheet = readySheet();
        sheet.beginCheck();
        sheet.applySheetFlags([hikking]);

        sheet.editCell(1, 1, 'Loves hiking');
        sheet.applyCellFlags({
            row: 1,
            column: 1,
            text: 'Loves hiking',
            ranges: []
        });

        expect(sheet.issueCount).toBe(0);
        // Flags and the edited tint are independent.
        expect(sheet.isEdited(1, 1)).toBe(true);
    });

    it('keeps a cell re-check that arrives before a slower full-sheet result', () => {
        const sheet = readySheet();
        sheet.beginCheck();

        // Edited mid-check; its own re-check comes back first.
        sheet.editCell(2, 1, 'Recieves mial');
        sheet.applyCellFlags({
            row: 2,
            column: 1,
            text: 'Recieves mial',
            ranges: [
                { start: 0, end: 8, suggestions: ['Receives'] },
                { start: 9, end: 13, suggestions: ['mail'] }
            ]
        });

        // The full-sheet result was computed from the old text.
        sheet.applySheetFlags([recieves, hikking]);

        expect(sheet.flagRanges(2, 1)).toHaveLength(2);
        expect(sheet.flagRanges(1, 1)).toEqual(hikking.ranges);
    });

    it('re-flags a cell after undo once its re-check returns', () => {
        const sheet = readySheet();
        sheet.beginCheck();
        sheet.applySheetFlags([hikking]);

        sheet.editCell(1, 1, 'Loves hiking');
        sheet.applyCellFlags({
            row: 1,
            column: 1,
            text: 'Loves hiking',
            ranges: []
        });
        sheet.undo();
        sheet.applyCellFlags(hikking);

        expect(sheet.flagRanges(1, 1)).toEqual(hikking.ranges);
    });
});

describe('Sheet ignored words', () => {
    const twice = {
        row: 2,
        column: 1,
        text: 'Hikking and hikking',
        ranges: [
            // Hunspell suggests nothing for the first, so the sheet-wide
            // summary takes the next occurrence's suggestion.
            { start: 0, end: 7, suggestions: [] },
            { start: 12, end: 19, suggestions: ['hiking'] }
        ]
    };

    it('lists a cell’s distinct flagged words in order', () => {
        const sheet = readySheet();
        // Flags only apply to the text a cell actually holds.
        sheet.editCell(2, 1, twice.text);
        sheet.beginCheck();
        sheet.applySheetFlags([twice]);
        // Flag text is kept, so the words read back as they were checked.
        expect(sheet.cellIssueWords(2, 1)).toEqual(['Hikking']);
        expect(sheet.cellIssueWords(1, 1)).toEqual([]);
    });

    it('counts flagged words across the sheet, most frequent first', () => {
        const sheet = readySheet();
        sheet.editCell(2, 1, twice.text);
        sheet.editCell(2, 0, 'Recieves mail');
        sheet.beginCheck();
        sheet.applySheetFlags([hikking, twice, { ...recieves, column: 0 }]);
        expect(sheet.flaggedWords()).toEqual([
            {
                key: 'hikking',
                word: 'hikking',
                count: 3,
                suggestion: 'hiking'
            },
            {
                key: 'recieves',
                word: 'Recieves',
                count: 1,
                suggestion: 'Receives'
            }
        ]);
    });

    it('takes the first suggestion found for a word', () => {
        const sheet = readySheet();
        sheet.editCell(2, 1, twice.text);
        sheet.beginCheck();
        sheet.applySheetFlags([twice]);
        expect(sheet.flaggedWords()).toEqual([
            {
                key: 'hikking',
                word: 'Hikking',
                count: 2,
                suggestion: 'hiking'
            }
        ]);
    });

    it('clears an ignored word everywhere at once, whatever its case', () => {
        const sheet = readySheet();
        sheet.beginCheck();
        sheet.applySheetFlags([hikking, recieves]);

        expect(sheet.ignoreWord('HIKKING')).toBe(true);

        expect([...sheet.ignoredWords]).toEqual(['hikking']);
        expect(sheet.flagRanges(1, 1)).toBeUndefined();
        expect(sheet.issueCount).toBe(1);
        expect(sheet.ignoreWord('hikking')).toBe(false);
    });

    it('keeps a cell’s other flagged words when one is ignored', () => {
        const sheet = readySheet();
        sheet.editCell(1, 1, 'Recieves hikking');
        sheet.beginCheck();
        sheet.applySheetFlags([
            {
                row: 1,
                column: 1,
                text: 'Recieves hikking',
                ranges: [
                    { start: 0, end: 8, suggestions: ['Receives'] },
                    { start: 9, end: 16, suggestions: ['hiking'] }
                ]
            }
        ]);
        sheet.ignoreWord('hikking');
        expect(sheet.cellIssueWords(1, 1)).toEqual(['Recieves']);
    });

    it('persists the ignore list in the sheet record', () => {
        const sheet = readySheet();
        sheet.ignoreWord('Hikking');
        const record = sheet.toRecord();
        expect(record?.ignoredWords).toEqual(['hikking']);
        const restored = Sheet.fromRecord(record!, sheet.rows);
        expect(restored.ignoredWords.has('hikking')).toBe(true);
    });
});
