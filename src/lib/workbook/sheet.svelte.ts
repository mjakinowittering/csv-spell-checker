import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import type { ColumnLanguage } from '$lib/languages/codes';
import type { LanguageGuess } from '$lib/languages/detect';
import type { CellFlags } from '$lib/spellcheck/protocol';
import type { MisspellingRange } from '$lib/spellcheck/tokenize';

import { EditHistory, type CellEdit } from './history.svelte';

export type SheetPhase =
    | { kind: 'parsing'; progress: number }
    | { kind: 'confirming'; guess: LanguageGuess }
    | { kind: 'ready' };

export type CheckState = 'idle' | 'checking' | 'done';

export type CellPosition = { row: number; column: number };

/** Map key for a cell. Row 0 is the header row. */
export function cellKey(row: number, column: number): string {
    return `${row}:${column}`;
}

function parseCellKey(key: string): CellPosition {
    const [row, column] = key.split(':').map(Number);
    return { row, column };
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

    checkState = $state<CheckState>('idle');
    checkProgress = $state(0);

    #overrides = new SvelteMap<string, string>();
    #flags = new SvelteMap<string, MisspellingRange[]>();

    /** Number of flagged cells. */
    issueCount = $derived(this.#flags.size);

    // Cells changed while a full-sheet check was running. Their own
    // single-cell re-check is authoritative over the full-sheet result.
    // Bookkeeping only, never rendered, so deliberately not reactive.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    #changedDuringCheck = new Set<string>();

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

    /** Misspelled ranges in a cell, or undefined when it is not flagged. */
    flagRanges(
        row: number,
        column: number
    ): readonly MisspellingRange[] | undefined {
        return this.#flags.get(cellKey(row, column));
    }

    /** Flagged cells in reading order: row by row, left to right. */
    flaggedCells(): CellPosition[] {
        return [...this.#flags.keys()]
            .map(parseCellKey)
            .sort((a, b) => a.row - b.row || a.column - b.column);
    }

    beginCheck() {
        this.checkState = 'checking';
        this.checkProgress = 0;
        this.#changedDuringCheck.clear();
    }

    setCheckProgress(fraction: number) {
        if (this.checkState === 'checking') this.checkProgress = fraction;
    }

    /** Replace all flags with a full-sheet result. */
    applySheetFlags(flags: readonly CellFlags[]) {
        for (const key of [...this.#flags.keys()]) {
            if (!this.#changedDuringCheck.has(key)) this.#flags.delete(key);
        }
        for (const flag of flags) {
            const key = cellKey(flag.row, flag.column);
            if (this.#changedDuringCheck.has(key)) continue;
            // Stale: the cell changed after the worker read it.
            if (this.cellValue(flag.row, flag.column) !== flag.text) continue;
            this.#flags.set(key, flag.ranges);
        }
        this.#changedDuringCheck.clear();
        this.checkState = 'done';
        this.checkProgress = 1;
    }

    /** Apply a single-cell re-check, unless the cell has changed since. */
    applyCellFlags(cell: CellFlags) {
        if (this.cellValue(cell.row, cell.column) !== cell.text) return;
        const key = cellKey(cell.row, cell.column);
        if (cell.ranges.length > 0) this.#flags.set(key, cell.ranges);
        else this.#flags.delete(key);
    }

    #write(row: number, column: number, value: string) {
        const key = cellKey(row, column);
        this.#overrides.set(key, value);
        this.edited.add(key);
        if (this.checkState === 'checking') this.#changedDuringCheck.add(key);
    }
}
