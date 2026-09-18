import type { Sheet } from './sheet.svelte';

/** The stored form of the workbook: tab order, active tab, upload counter. */
export type WorkbookRecord = {
    activeId: string | null;
    sheetOrder: string[];
    uploadCount: number;
};

/** The set of open sheets and which one is showing. */
export class Workbook {
    // The array is replaced on open/close, never mutated, so it stays raw;
    // each Sheet carries its own fine-grained state.
    sheets = $state.raw<Sheet[]>([]);
    activeId = $state<string | null>(null);

    active = $derived(
        this.sheets.find((sheet) => sheet.id === this.activeId) ?? null
    );

    #uploadCount = 0;

    /** The next "Sheet N" number. Never reused, even after tabs close. */
    nextUploadNumber(): number {
        this.#uploadCount += 1;
        return this.#uploadCount;
    }

    /**
     * Put back sheets loaded from storage, ahead of any opened while loading.
     * Restores the active tab when it still exists.
     */
    restore(sheets: Sheet[], activeId: string | null, uploadCount: number) {
        this.sheets = [...sheets, ...this.sheets];
        this.#uploadCount = Math.max(this.#uploadCount, uploadCount);
        if (this.activeId === null) {
            this.activeId =
                sheets.find((sheet) => sheet.id === activeId)?.id ??
                sheets[0]?.id ??
                null;
        }
    }

    toRecord(): WorkbookRecord {
        return {
            activeId: this.activeId,
            sheetOrder: this.sheets.map((sheet) => sheet.id),
            uploadCount: this.#uploadCount
        };
    }

    open(sheet: Sheet) {
        this.sheets = [...this.sheets, sheet];
        this.activeId = sheet.id;
    }

    activate(id: string) {
        if (this.sheets.some((sheet) => sheet.id === id)) this.activeId = id;
    }

    /** Whether a sheet is still open: a tab can close while it parses. */
    has(id: string): boolean {
        return this.sheets.some((sheet) => sheet.id === id);
    }

    close(id: string) {
        const index = this.sheets.findIndex((sheet) => sheet.id === id);
        if (index === -1) return;

        this.sheets = this.sheets.toSpliced(index, 1);
        if (this.activeId !== id) return;

        // Activate the tab that slid into the closed one's place, or the one
        // before it when the last tab was closed.
        const neighbour = this.sheets[index] ?? this.sheets[index - 1];
        this.activeId = neighbour?.id ?? null;
    }
}
