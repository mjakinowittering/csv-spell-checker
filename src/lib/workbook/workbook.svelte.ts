import type { Sheet } from './sheet';

/** The set of open sheets and which one is showing. */
export class Workbook {
    // Sheets can hold tens of thousands of cells; they are replaced, never
    // mutated in place, so a raw array avoids proxying every row.
    sheets = $state.raw<Sheet[]>([]);
    activeId = $state<string | null>(null);

    active = $derived(
        this.sheets.find((sheet) => sheet.id === this.activeId) ?? null
    );

    open(sheet: Sheet) {
        this.sheets = [...this.sheets, sheet];
        this.activeId = sheet.id;
    }

    activate(id: string) {
        if (this.sheets.some((sheet) => sheet.id === id)) this.activeId = id;
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
