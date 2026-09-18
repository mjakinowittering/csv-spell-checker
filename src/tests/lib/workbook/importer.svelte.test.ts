import { describe, expect, it, vi } from 'vitest';

import { importPastedText } from '$lib/workbook/importer';
import type { Sheet } from '$lib/workbook/sheet.svelte';
import { Workbook } from '$lib/workbook/workbook.svelte';

const { parseInWorker, detectSheetLanguage } = vi.hoisted(() => ({
    parseInWorker: vi.fn(),
    detectSheetLanguage: vi.fn()
}));

vi.mock('$lib/csv/parser', () => ({ parseInWorker }));
vi.mock('$lib/languages/detect', () => ({ detectSheetLanguage }));

/** Let every pending promise in the import settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

/** A promise this test resolves by hand, to hold parsing open. */
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((settle) => (resolve = settle));
    return { promise, resolve };
}

describe('importing a sheet whose tab is closed first', () => {
    it('never reports a sheet the user closed while it parsed', async () => {
        const parsing = deferred<string[][]>();
        parseInWorker.mockReturnValue(parsing.promise);
        const workbook = new Workbook();
        const parsed = vi.fn<(sheet: Sheet) => void>();

        importPastedText(workbook, 'Name\tNote\nAda\tHi', parsed);
        expect(workbook.sheets).toHaveLength(1);

        // The tab is closed while the parse worker is still running.
        workbook.close(workbook.sheets[0].id);
        parsing.resolve([['Name', 'Note']]);
        await flush();

        // Nothing is reported, so nothing is written to IndexedDB.
        expect(parsed).not.toHaveBeenCalled();
        expect(workbook.sheets).toEqual([]);
        expect(detectSheetLanguage).not.toHaveBeenCalled();
    });

    it('never reports a sheet closed while its language was detected', async () => {
        const detecting = deferred<never>();
        parseInWorker.mockResolvedValue([['Name'], ['Ada']]);
        detectSheetLanguage.mockReturnValue(detecting.promise);
        const workbook = new Workbook();
        const parsed = vi.fn<(sheet: Sheet) => void>();

        importPastedText(workbook, 'Name\nAda', parsed);
        await vi.waitFor(() => expect(detectSheetLanguage).toHaveBeenCalled());

        workbook.close(workbook.sheets[0].id);
        detecting.resolve({
            detected: 'en',
            prefill: 'en-GB',
            confidence: 1,
            confident: true,
            source: 'franc'
        } as never);
        // Let the import finish what it was going to do before asserting.
        await flush();

        expect(parsed).not.toHaveBeenCalled();
        expect(workbook.sheets).toEqual([]);
    });

    it('still reports a sheet whose tab stays open', async () => {
        parseInWorker.mockResolvedValue([['Name'], ['Ada']]);
        detectSheetLanguage.mockResolvedValue({
            detected: 'en',
            prefill: 'en-GB',
            confidence: 1,
            confident: true,
            source: 'franc'
        });
        const workbook = new Workbook();
        const parsed = vi.fn<(sheet: Sheet) => void>();

        importPastedText(workbook, 'Name\nAda', parsed);
        await vi.waitFor(() => expect(parsed).toHaveBeenCalledOnce());
        expect(workbook.sheets).toHaveLength(1);
        expect(workbook.sheets[0].phase.kind).toBe('confirming');
    });
});
