import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import type { ColumnLanguage } from '$lib/languages/codes';
import type { LanguageGuess } from '$lib/languages/detect';

import { EditHistory, type CellEdit } from './history.svelte';

export type SheetPhase =
    | { kind: 'parsing'; progress: number }
    | { kind: 'confirming'; guess: LanguageGuess }
    | { kind: 'ready' };

/** Map key for a cell. Row 0 is the header row. */
export function cellKey(row: number, column: number): string {
    return `${row}:${column}`;
}

/** One open tab: its parsed rows and where it is in the import flow. */
export class Sheet {
    readonly id = crypto.randomUUID();
    readonly name: string;

    phase = $state<SheetPhase>({ kind: 'parsing', progress: 0 });

    /**
     * The cells as parsed. Row 0 is the header row. Never mutated: edits live
     * in a per-cell override map so an edit re-renders one cell, not the grid.
     */
    rows = $state.raw<string[][]>([]);

    /** One language per column, set only by confirming the language screen. */
    languages = $state.raw<ColumnLanguage[]>([]);

    /**
     * Every cell that has ever been edited. Permanent: undo restores a cell's
     * value but never its tint, and error state has no effect on it.
     */
    readonly edited = new SvelteSet<string>();

    readonly history = new EditHistory();

    #overrides = new SvelteMap<string, string>();

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Record the user's per-column choices. Every new sheet must pass through
     * the confirmation screen; there is no other way to reach `ready`.
     */
    confirmLanguages(languages: ColumnLanguage[]) {
        if (this.phase.kind !== 'confirming') return;
        this.languages = languages;
        this.phase = { kind: 'ready' };
    }

    cellValue(row: number, column: number): string {
        return (
            this.#overrides.get(cellKey(row, column)) ??
            this.rows[row]?.[column] ??
            ''
        );
    }

    isEdited(row: number, column: number): boolean {
        return this.edited.has(cellKey(row, column));
    }

    /**
     * Commit a value from the cell editor. Returns the edit, or null when the
     * value is unchanged (which neither tints the cell nor adds history).
     */
    editCell(row: number, column: number, value: string): CellEdit | null {
        const before = this.cellValue(row, column);
        if (value === before) return null;
        const edit: CellEdit = { row, column, before, after: value };
        this.#write(row, column, value);
        this.history.push(edit);
        return edit;
    }

    undo(): CellEdit | null {
        const edit = this.history.undo();
        if (edit) this.#write(edit.row, edit.column, edit.before);
        return edit;
    }

    redo(): CellEdit | null {
        const edit = this.history.redo();
        if (edit) this.#write(edit.row, edit.column, edit.after);
        return edit;
    }

    /** Every cell's current value, edits applied, header row first. */
    snapshot(): string[][] {
        return this.rows.map((row, rowIndex) =>
            row.map(
                (value, columnIndex) =>
                    this.#overrides.get(cellKey(rowIndex, columnIndex)) ?? value
            )
        );
    }

    #write(row: number, column: number, value: string) {
        const key = cellKey(row, column);
        this.#overrides.set(key, value);
        this.edited.add(key);
    }
}
