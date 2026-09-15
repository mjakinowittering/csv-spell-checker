import type { Sheet } from '$lib/workbook/sheet.svelte';
import type { Workbook } from '$lib/workbook/workbook.svelte';

import type { WorkbookStore } from './store';

/**
 * Write-through persistence. Every action that changes stored data calls one
 * of these straight away — never on a timer or on unload. Writes are issued in
 * call order, and IndexedDB applies overlapping transactions in that order.
 */
export class Persistence {
    readonly #store: WorkbookStore;
    readonly #onerror: () => void;
    #reportedError = false;

    constructor(store: WorkbookStore, onerror: () => void) {
        this.#store = store;
        this.#onerror = onerror;
    }

    get store(): WorkbookStore {
        return this.#store;
    }

    /** A sheet finished parsing: store its cells, record and the tab order. */
    sheetAdded(sheet: Sheet, workbook: Workbook) {
        this.#sheet(sheet, true);
        this.workbookChanged(workbook);
    }

    /** A sheet's name, languages, ignore list or cells changed. */
    sheetChanged(sheet: Sheet) {
        this.#sheet(sheet, false);
    }

    sheetRemoved(id: string, workbook: Workbook) {
        this.#write(this.#store.removeSheet(id));
        this.workbookChanged(workbook);
    }

    /** Tab order, the active tab or the upload counter changed. */
    workbookChanged(workbook: Workbook) {
        this.#write(this.#store.saveWorkbook(workbook.toRecord()));
    }

    #sheet(sheet: Sheet, withRows: boolean) {
        const record = sheet.toRecord();
        // A sheet that is still parsing has nothing worth keeping yet.
        if (!record) return;
        this.#write(
            this.#store.saveSheet(record, withRows ? sheet.rows : undefined)
        );
    }

    #write(pending: Promise<void>) {
        pending.catch((error: unknown) => {
            console.error('Could not save to IndexedDB', error);
            // One notice per session: a failing store fails every write.
            if (this.#reportedError) return;
            this.#reportedError = true;
            this.#onerror();
        });
    }
}
