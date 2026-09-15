import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WorkbookStore } from '$lib/persistence/store';
import { Sheet } from '$lib/workbook/sheet.svelte';
import { Workbook } from '$lib/workbook/workbook.svelte';

// Runs against the browser's real IndexedDB, in a database per test.
let store: WorkbookStore;

beforeEach(() => {
    store = new WorkbookStore(`test-${crypto.randomUUID()}`);
});

afterEach(async () => {
    await store.destroy();
});

function parsedSheet(name: string, rows: string[][]): Sheet {
    const sheet = new Sheet(name, `${name}.csv`);
    sheet.rows = rows;
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
    return sheet;
}

async function reload(): Promise<{ workbook: Workbook; sheets: Sheet[] }> {
    const stored = await store.load();
    const sheets = stored.sheets.map(({ record, rows }) =>
        Sheet.fromRecord(record, rows)
    );
    const workbook = new Workbook();
    workbook.restore(sheets, stored.activeId, stored.uploadCount);
    return { workbook, sheets };
}

describe('WorkbookStore', () => {
    it('loads nothing from an empty database', async () => {
        const stored = await store.load();
        expect(stored.sheets).toEqual([]);
        expect(stored.activeId).toBeNull();
    });

    it('round-trips a sheet waiting for confirmation', async () => {
        const sheet = parsedSheet('People', [
            ['Name', 'Bio'],
            ['Sarah', 'Loves hikking']
        ]);
        await store.saveSheet(sheet.toRecord()!, sheet.rows);

        const { sheets } = await reload();
        expect(sheets).toHaveLength(1);
        expect(sheets[0].id).toBe(sheet.id);
        expect(sheets[0].name).toBe('People');
        expect(sheets[0].sourceFileName).toBe('People.csv');
        expect(sheets[0].phase).toEqual(sheet.phase);
        expect(sheets[0].snapshot()).toEqual(sheet.snapshot());
    });

    it('keeps edits, edited markers, languages and the ignore list', async () => {
        const sheet = parsedSheet('People', [
            ['Name', 'Bio'],
            ['Sarah', 'Loves hikking'],
            ['Tom', 'Enjoys coffee']
        ]);
        await store.saveSheet(sheet.toRecord()!, sheet.rows);

        sheet.confirmLanguages(['none', 'en-GB']);
        sheet.editCell(1, 1, 'Loves hiking');
        sheet.ignoredWords.add('acme');
        sheet.name = 'Renamed';
        // Later writes send the record only; the rows are stored once.
        await store.saveSheet(sheet.toRecord()!);

        const { sheets } = await reload();
        const [restored] = sheets;
        expect(restored.name).toBe('Renamed');
        expect(restored.phase.kind).toBe('ready');
        expect(restored.languages).toEqual(['none', 'en-GB']);
        expect(restored.cellValue(1, 1)).toBe('Loves hiking');
        expect(restored.isEdited(1, 1)).toBe(true);
        expect(restored.isEdited(2, 1)).toBe(false);
        expect([...restored.ignoredWords]).toEqual(['acme']);
        // Original rows are untouched; edits are layered on top.
        expect(restored.rows[1][1]).toBe('Loves hikking');
    });

    it('never stores spelling flags', async () => {
        const sheet = parsedSheet('People', [['Name'], ['Recieve']]);
        sheet.confirmLanguages(['en-GB']);
        sheet.beginCheck();
        sheet.applySheetFlags([
            {
                row: 1,
                column: 0,
                text: 'Recieve',
                ranges: [{ start: 0, end: 7, suggestions: ['Receive'] }]
            }
        ]);
        expect(sheet.issueCount).toBe(1);
        await store.saveSheet(sheet.toRecord()!, sheet.rows);

        const { sheets } = await reload();
        expect(sheets[0].issueCount).toBe(0);
        expect(sheets[0].checkState).toBe('idle');
    });

    it('restores tab order, the active tab and the upload counter', async () => {
        const workbook = new Workbook();
        const first = parsedSheet('One', [['a']]);
        const second = parsedSheet('Two', [['b']]);
        const third = parsedSheet('Three', [['c']]);
        workbook.nextUploadNumber();
        workbook.nextUploadNumber();
        for (const sheet of [first, second, third]) {
            workbook.open(sheet);
            await store.saveSheet(sheet.toRecord()!, sheet.rows);
        }
        workbook.activate(second.id);
        await store.saveWorkbook(workbook.toRecord());

        const { workbook: restored } = await reload();
        expect(restored.sheets.map((sheet) => sheet.name)).toEqual([
            'One',
            'Two',
            'Three'
        ]);
        expect(restored.activeId).toBe(second.id);
        expect(restored.nextUploadNumber()).toBe(3);
    });

    it('forgets a removed sheet', async () => {
        const workbook = new Workbook();
        const keep = parsedSheet('Keep', [['a']]);
        const drop = parsedSheet('Drop', [['b']]);
        for (const sheet of [keep, drop]) {
            workbook.open(sheet);
            await store.saveSheet(sheet.toRecord()!, sheet.rows);
        }
        workbook.close(drop.id);
        await store.removeSheet(drop.id);
        await store.saveWorkbook(workbook.toRecord());

        const { sheets } = await reload();
        expect(sheets.map((sheet) => sheet.name)).toEqual(['Keep']);
    });

    it('does not store a sheet that is still parsing', () => {
        expect(new Sheet('Loading').toRecord()).toBeNull();
    });
});
