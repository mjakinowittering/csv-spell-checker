import { describe, expect, it } from 'vitest';

import { Sheet } from '$lib/workbook/sheet.svelte';

function readySheet(): Sheet {
    const sheet = new Sheet('Sheet 1');
    sheet.rows = [
        ['Name', 'Note'],
        ['Ada', 'Recieve'],
        ['Bob', 'Fine']
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
    sheet.confirmLanguages(['en-GB', 'none']);
    return sheet;
}

describe('Sheet language confirmation', () => {
    it('only reaches ready from the confirmation phase', () => {
        const sheet = new Sheet('Sheet 1');
        sheet.confirmLanguages(['en-GB']);
        expect(sheet.phase.kind).toBe('parsing');
        expect(sheet.languages).toEqual([]);

        expect(readySheet().phase.kind).toBe('ready');
    });
});

describe('Sheet edits', () => {
    it('commits a value and tints the cell', () => {
        const sheet = readySheet();
        const edit = sheet.editCell(1, 1, 'Receive');
        expect(edit).toEqual({
            row: 1,
            column: 1,
            before: 'Recieve',
            after: 'Receive'
        });
        expect(sheet.cellValue(1, 1)).toBe('Receive');
        expect(sheet.isEdited(1, 1)).toBe(true);
        expect(sheet.isEdited(2, 1)).toBe(false);
    });

    it('ignores a confirm that changes nothing', () => {
        const sheet = readySheet();
        expect(sheet.editCell(1, 0, 'Ada')).toBeNull();
        expect(sheet.isEdited(1, 0)).toBe(false);
        expect(sheet.history.canUndo).toBe(false);
    });

    it('edits the header row like any other cell', () => {
        const sheet = readySheet();
        sheet.editCell(0, 1, 'Notes');
        expect(sheet.cellValue(0, 1)).toBe('Notes');
        expect(sheet.isEdited(0, 1)).toBe(true);
    });

    it('undoes and redoes, keeping the tint permanently', () => {
        const sheet = readySheet();
        sheet.editCell(1, 1, 'Receive');

        expect(sheet.undo()).not.toBeNull();
        expect(sheet.cellValue(1, 1)).toBe('Recieve');
        expect(sheet.isEdited(1, 1)).toBe(true);
        expect(sheet.history.canUndo).toBe(false);
        expect(sheet.history.canRedo).toBe(true);

        expect(sheet.redo()).not.toBeNull();
        expect(sheet.cellValue(1, 1)).toBe('Receive');
        expect(sheet.history.canRedo).toBe(false);
    });

    it('undoes in reverse order and drops redo after a new edit', () => {
        const sheet = readySheet();
        sheet.editCell(1, 1, 'first');
        sheet.editCell(1, 1, 'second');
        sheet.undo();
        expect(sheet.cellValue(1, 1)).toBe('first');

        sheet.editCell(2, 1, 'other');
        expect(sheet.history.canRedo).toBe(false);
        expect(sheet.redo()).toBeNull();

        sheet.undo();
        sheet.undo();
        expect(sheet.cellValue(2, 1)).toBe('Fine');
        expect(sheet.cellValue(1, 1)).toBe('Recieve');
        expect(sheet.undo()).toBeNull();
    });

    it('snapshots current values without mutating the parsed rows', () => {
        const sheet = readySheet();
        sheet.editCell(2, 0, 'Bobby');
        expect(sheet.snapshot()).toEqual([
            ['Name', 'Note'],
            ['Ada', 'Recieve'],
            ['Bobby', 'Fine']
        ]);
        expect(sheet.rows[2][0]).toBe('Bob');
    });
});
