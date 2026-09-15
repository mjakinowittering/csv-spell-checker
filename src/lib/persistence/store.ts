import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { SheetRecord } from '$lib/workbook/sheet.svelte';
import type { WorkbookRecord } from '$lib/workbook/workbook.svelte';

export const DATABASE_NAME = 'csv-spell-checker';
const DATABASE_VERSION = 1;
const WORKBOOK_KEY = 'state';

type RowsRecord = { id: string; rows: string[][] };

interface SpellCheckerDatabase extends DBSchema {
    /** Everything about a sheet except its parsed cells. Small; rewritten on every change. */
    sheets: { key: string; value: SheetRecord };
    /** A sheet's cells as parsed. Large; written once, when parsing finishes. */
    rows: { key: string; value: RowsRecord };
    /** Tab order, the active tab and the upload counter. */
    workbook: { key: string; value: WorkbookRecord };
}

export type StoredSheet = { record: SheetRecord; rows: string[][] };
export type StoredWorkbook = WorkbookRecord & { sheets: StoredSheet[] };

/**
 * IndexedDB storage for open sheets. Derived data — spelling flags, undo
 * history — is never stored: it is recomputed after loading, so stored and
 * derived state cannot disagree.
 */
export class WorkbookStore {
    readonly #name: string;
    #database: Promise<IDBPDatabase<SpellCheckerDatabase>> | null = null;

    constructor(name: string = DATABASE_NAME) {
        this.#name = name;
    }

    #open(): Promise<IDBPDatabase<SpellCheckerDatabase>> {
        this.#database ??= openDB<SpellCheckerDatabase>(
            this.#name,
            DATABASE_VERSION,
            {
                upgrade(database) {
                    database.createObjectStore('sheets', { keyPath: 'id' });
                    database.createObjectStore('rows', { keyPath: 'id' });
                    database.createObjectStore('workbook');
                }
            }
        );
        return this.#database;
    }

    /** Every stored sheet, in tab order, with the saved workbook state. */
    async load(): Promise<StoredWorkbook> {
        const database = await this.#open();
        const transaction = database.transaction(
            ['sheets', 'rows', 'workbook'],
            'readonly'
        );
        const [records, allRows, state] = await Promise.all([
            transaction.objectStore('sheets').getAll(),
            transaction.objectStore('rows').getAll(),
            transaction.objectStore('workbook').get(WORKBOOK_KEY)
        ]);
        await transaction.done;

        const recordsById = new Map(
            records.map((record) => [record.id, record])
        );
        const rowsById = new Map(
            allRows.map((entry) => [entry.id, entry.rows])
        );
        // Saved order first; any sheet missing from it (an interrupted write)
        // still comes back, after the ordered ones.
        const order = [
            ...(state?.sheetOrder ?? []),
            ...records.map((record) => record.id)
        ].filter((id, index, ids) => ids.indexOf(id) === index);

        const sheets: StoredSheet[] = [];
        for (const id of order) {
            const record = recordsById.get(id);
            const rows = rowsById.get(id);
            if (record && rows) sheets.push({ record, rows });
        }

        return {
            activeId: state?.activeId ?? null,
            sheetOrder: sheets.map((sheet) => sheet.record.id),
            uploadCount: state?.uploadCount ?? 0,
            sheets
        };
    }

    /** Save a sheet's record, and its parsed rows when given. */
    async saveSheet(record: SheetRecord, rows?: string[][]): Promise<void> {
        const database = await this.#open();
        const transaction = database.transaction(
            ['sheets', 'rows'],
            'readwrite'
        );
        await Promise.all([
            transaction.objectStore('sheets').put(record),
            rows
                ? transaction.objectStore('rows').put({ id: record.id, rows })
                : null,
            transaction.done
        ]);
    }

    async removeSheet(id: string): Promise<void> {
        const database = await this.#open();
        const transaction = database.transaction(
            ['sheets', 'rows'],
            'readwrite'
        );
        await Promise.all([
            transaction.objectStore('sheets').delete(id),
            transaction.objectStore('rows').delete(id),
            transaction.done
        ]);
    }

    async saveWorkbook(state: WorkbookRecord): Promise<void> {
        const database = await this.#open();
        await database.put('workbook', state, WORKBOOK_KEY);
    }

    /** Close the connection and delete the whole database. */
    async destroy(): Promise<void> {
        if (this.#database) (await this.#database).close();
        this.#database = null;
        await deleteDB(this.#name);
    }
}
