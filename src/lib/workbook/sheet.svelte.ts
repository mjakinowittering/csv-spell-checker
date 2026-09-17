import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import {
    isLanguageCode,
    type ColumnLanguage,
    type LanguageCode
} from '$lib/languages/codes';
import type { LanguageGuess } from '$lib/languages/detect';
import type {
    CellFlags,
    CellLanguages,
    WordFlag
} from '$lib/spellcheck/protocol';
import {
    ignoreKey,
    matchCase,
    type MisspellingRange
} from '$lib/spellcheck/tokenize';

import { EditHistory, type CellEdit, type EditStep } from './history.svelte';

export type SheetPhase =
    | { kind: 'parsing'; progress: number }
    | { kind: 'confirming'; guess: LanguageGuess }
    | { kind: 'ready' };

export type CheckState = 'idle' | 'checking' | 'done';

export type CellPosition = { row: number; column: number };

/**
 * A flagged word across the sheet: its ignore key, as written, how often it
 * occurs, and Hunspell's top suggestion (null when it has none).
 */
export type FlaggedWord = {
    key: string;
    word: string;
    count: number;
    suggestion: string | null;
};

/**
 * A flagged word in one cell, grouped across capitalisations ("Trés" and
 * "trés" are one issue), with Hunspell's top suggestion if it has one.
 */
export type CellIssue = {
    key: string;
    /** The first spelling found, for display. */
    word: string;
    /** The suggestion shown for the issue. */
    suggestion: string | null;
    /** Each spelling found in the cell, mapped to its own top suggestion. */
    replacements: Record<string, string>;
};

/**
 * What Fix writes for one spelling of an issue: that spelling's own
 * suggestion, or the issue's suggestion with its case matched.
 */
export function issueReplacement(
    issue: CellIssue,
    word: string
): string | null {
    return (
        issue.replacements[word] ??
        (issue.suggestion === null ? null : matchCase(word, issue.suggestion))
    );
}

/**
 * What is stored for a sheet in IndexedDB (its parsed rows are stored
 * separately). Spelling flags and undo history are derived and never stored.
 */
export type SheetRecord = {
    id: string;
    name: string;
    sourceFileName: string | null;
    phase: { kind: 'confirming'; guess: LanguageGuess } | { kind: 'ready' };
    /** The confirmed sheet-wide language; null when columns differ. */
    sheetLanguage: ColumnLanguage | null;
    languages: ColumnLanguage[];
    ignoredWords: string[];
    /**
     * Instance ignores, as `dismissalKey()` keys: one word dismissed in one
     * cell. Distinct from `ignoredWords`, which covers the whole sheet.
     */
    dismissedWords: string[];
    /** Edited cell values, as `[cellKey, value]` pairs. */
    overrides: [string, string][];
    /** Keys of every cell ever edited. */
    edited: string[];
};

/** Map key for a cell. Row 0 is the header row. */
export function cellKey(row: number, column: number): string {
    return `${row}:${column}`;
}

/** Map key for one word dismissed in one cell, case-insensitively. */
export function dismissalKey(
    row: number,
    column: number,
    word: string
): string {
    return `${row}:${column}:${ignoreKey(word)}`;
}

/** The one language every column shares, or null when they differ. */
function uniformLanguage(
    languages: readonly ColumnLanguage[]
): ColumnLanguage | null {
    const [first] = languages;
    return first !== undefined &&
        languages.every((language) => language === first)
        ? first
        : null;
}

/**
 * Rewrite flagged ranges with what `replacementFor` returns (null keeps the
 * range). The remaining ranges are shifted to stay on their words. Null when
 * nothing changed.
 */
function applyFixes(
    text: string,
    ranges: readonly WordFlag[],
    replacementFor: (range: WordFlag) => string | null
): { text: string; ranges: WordFlag[] } | null {
    let result = '';
    let cursor = 0;
    let shift = 0;
    let changed = false;
    const kept: WordFlag[] = [];
    for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
        const replacement = replacementFor(range);
        result += text.slice(cursor, range.start);
        if (replacement !== null) {
            result += replacement;
            shift += replacement.length - (range.end - range.start);
            changed = true;
        } else {
            result += text.slice(range.start, range.end);
            kept.push({
                ...range,
                start: range.start + shift,
                end: range.end + shift
            });
        }
        cursor = range.end;
    }
    return changed ? { text: result + text.slice(cursor), ranges: kept } : null;
}

function parseCellKey(key: string): CellPosition {
    const [row, column] = key.split(':').map(Number);
    return { row, column };
}

/** One open tab: its parsed rows and where it is in the import flow. */
export class Sheet {
    readonly id: string;
    /** The tab's display name. */
    name = $state('');
    /** The uploaded file's name, reused for export. Null for pasted sheets. */
    readonly sourceFileName: string | null;

    phase = $state<SheetPhase>({ kind: 'parsing', progress: 0 });

    /**
     * The cells as parsed. Row 0 is the header row. Never mutated: edits live
     * in a per-cell override map so an edit re-renders one cell, not the grid.
     */
    rows = $state.raw<string[][]>([]);

    /**
     * The sheet-wide language picked on the confirmation screen, or null when
     * the columns were set to different languages.
     */
    sheetLanguage = $state<ColumnLanguage | null>(null);

    /** One language per column, set only by confirming the language screen. */
    languages = $state.raw<ColumnLanguage[]>([]);

    /** The distinct languages actually spell-checked, in column order. */
    checkedLanguages = $derived(
        this.languages.filter(
            (language, index, all): language is LanguageCode =>
                isLanguageCode(language) && all.indexOf(language) === index
        )
    );

    /** The grid cell last focused or clicked. Not persisted. */
    selectedCell = $state<CellPosition | null>(null);

    /** Words dismissed as false positives for this sheet. */
    readonly ignoredWords = new SvelteSet<string>();

    /**
     * Single occurrences dismissed from a cell's issues list: that word, in
     * that cell only. It stays flagged everywhere else in the sheet.
     */
    readonly dismissedWords = new SvelteSet<string>();

    /**
     * Every cell that has ever been edited. Permanent: undo restores a cell's
     * value but never its tint, and error state has no effect on it.
     */
    readonly edited = new SvelteSet<string>();

    readonly history = new EditHistory();

    checkState = $state<CheckState>('idle');
    checkProgress = $state(0);

    #overrides = new SvelteMap<string, string>();
    // Each flagged cell's ranges with the text they were found in, so the
    // flagged words can be read back even while an edit is being re-checked.
    #flags = new SvelteMap<
        string,
        { text: string; ranges: readonly WordFlag[] }
    >();

    // Which languages matched a cell's words, most words first, for cells
    // where a fallback language matched something. Derived from each check.
    #cellLanguages = new SvelteMap<string, [LanguageCode, number][]>();

    /** Number of flagged cells. */
    issueCount = $derived(this.#flags.size);

    /**
     * The issue last reached with previous/next. Kept after that issue is
     * fixed, so navigation carries on from the same place.
     */
    currentIssue = $state<CellPosition | null>(null);

    // Cells changed while a full-sheet check was running. Their own
    // single-cell re-check is authoritative over the full-sheet result.
    // Bookkeeping only, never rendered, so deliberately not reactive.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    #changedDuringCheck = new Set<string>();

    constructor(
        name: string,
        sourceFileName: string | null = null,
        id: string = crypto.randomUUID()
    ) {
        this.id = id;
        this.name = name;
        this.sourceFileName = sourceFileName;
    }

    /** Rebuild a sheet saved with `toRecord()`. Flags start empty. */
    static fromRecord(record: SheetRecord, rows: string[][]): Sheet {
        const sheet = new Sheet(record.name, record.sourceFileName, record.id);
        sheet.rows = rows;
        sheet.languages = record.languages;
        sheet.sheetLanguage = record.sheetLanguage ?? null;
        sheet.phase = record.phase;
        for (const word of record.ignoredWords) sheet.ignoredWords.add(word);
        for (const key of record.dismissedWords ?? []) {
            sheet.dismissedWords.add(key);
        }
        for (const [key, value] of record.overrides) {
            sheet.#overrides.set(key, value);
        }
        for (const key of record.edited) sheet.edited.add(key);
        return sheet;
    }

    /** The stored form of this sheet, or null while it is still parsing. */
    toRecord(): SheetRecord | null {
        if (this.phase.kind === 'parsing') return null;
        return {
            id: this.id,
            name: this.name,
            sourceFileName: this.sourceFileName,
            // Snapshot: IndexedDB cannot clone Svelte's state proxies.
            phase: $state.snapshot(this.phase),
            sheetLanguage: this.sheetLanguage,
            languages: [...this.languages],
            ignoredWords: [...this.ignoredWords],
            dismissedWords: [...this.dismissedWords],
            overrides: [...this.#overrides.entries()],
            edited: [...this.edited]
        };
    }

    /**
     * Record the user's per-column choices. Every new sheet must pass through
     * the confirmation screen; there is no other way to reach `ready`.
     */
    confirmLanguages(
        languages: ColumnLanguage[],
        sheetLanguage: ColumnLanguage | null = uniformLanguage(languages)
    ) {
        if (this.phase.kind !== 'confirming') return;
        this.languages = languages;
        this.sheetLanguage = sheetLanguage;
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
        this.history.push([edit]);
        return edit;
    }

    /** Reverse the last step (every cell of a sheet-wide fix at once). */
    undo(): EditStep | null {
        const step = this.history.undo();
        if (!step) return null;
        for (const edit of [...step].reverse()) {
            this.#write(edit.row, edit.column, edit.before);
        }
        return step;
    }

    redo(): EditStep | null {
        const step = this.history.redo();
        if (!step) return null;
        for (const edit of step) {
            this.#write(edit.row, edit.column, edit.after);
        }
        return step;
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
        return this.#flags.get(cellKey(row, column))?.ranges;
    }

    /**
     * The distinct misspelled words in one cell, in the order they appear,
     * each with its top suggestion.
     */
    cellIssues(row: number, column: number): CellIssue[] {
        const flag = this.#flags.get(cellKey(row, column));
        if (!flag) return [];
        // Local scratch, never rendered: no reactivity needed.
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const issues = new Map<string, CellIssue>();
        for (const { start, end, suggestions } of flag.ranges) {
            const word = flag.text.slice(start, end);
            const key = ignoreKey(word);
            const suggestion = suggestions[0] ?? null;
            let issue = issues.get(key);
            if (!issue) {
                issue = { key, word, suggestion, replacements: {} };
                issues.set(key, issue);
            }
            issue.suggestion ??= suggestion;
            if (suggestion !== null) issue.replacements[word] ??= suggestion;
        }
        return [...issues.values()];
    }

    /** Every flagged word in the sheet, most frequent first. */
    flaggedWords(): FlaggedWord[] {
        // Local scratch, never rendered: no reactivity needed.
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const words = new Map<string, FlaggedWord>();
        for (const { text, ranges } of this.#flags.values()) {
            for (const { start, end, suggestions } of ranges) {
                const word = text.slice(start, end);
                const key = ignoreKey(word);
                const suggestion = suggestions[0] ?? null;
                const entry = words.get(key);
                if (entry) {
                    entry.count += 1;
                    entry.suggestion ??= suggestion;
                } else {
                    words.set(key, { key, word, count: 1, suggestion });
                }
            }
        }
        return [...words.values()].sort(
            (a, b) => b.count - a.count || a.word.localeCompare(b.word)
        );
    }

    /**
     * Stop flagging a word anywhere in this sheet. Its flags are cleared at
     * once; the caller then re-checks the sheet in the worker so the result
     * is authoritative. Returns false when the word was already ignored.
     */
    ignoreWord(word: string): boolean {
        const key = ignoreKey(word);
        if (key === '' || this.ignoredWords.has(key)) return false;
        this.ignoredWords.add(key);
        for (const [cell, flag] of [...this.#flags.entries()]) {
            const ranges = flag.ranges.filter(
                ({ start, end }) =>
                    ignoreKey(flag.text.slice(start, end)) !== key
            );
            if (ranges.length === flag.ranges.length) continue;
            if (ranges.length > 0) this.#flags.set(cell, { ...flag, ranges });
            else this.#flags.delete(cell);
        }
        return true;
    }

    /**
     * Replace a flagged word with its suggestion everywhere in the sheet, as
     * one undo step. Only flagged occurrences change, and each is a whole word
     * found by the check, so a longer word containing it is untouched. Every
     * capitalisation is fixed, and each keeps its case: an occurrence takes
     * its own top suggestion, or, when Hunspell had none for that spelling,
     * the word's suggestion with the case matched. Affected cells are marked
     * edited, and their other flags stay put. The caller re-checks the sheet
     * in the worker. Returns the edits: none when no spelling had a suggestion.
     */
    fixWord(word: string): CellEdit[] {
        const key = ignoreKey(word);
        const matches = (text: string, { start, end }: WordFlag) =>
            ignoreKey(text.slice(start, end)) === key;

        let fallback: string | null = null;
        for (const { text, ranges } of this.#flags.values()) {
            const found = ranges.find(
                (range) => matches(text, range) && range.suggestions.length > 0
            );
            if (found) {
                fallback = found.suggestions[0];
                break;
            }
        }
        if (fallback === null) return [];
        const groupSuggestion = fallback;

        const edits: CellEdit[] = [];
        for (const [cell, flag] of [...this.#flags.entries()]) {
            const { row, column } = parseCellKey(cell);
            // Stale: the cell changed since it was checked.
            if (this.cellValue(row, column) !== flag.text) continue;
            const fixed = applyFixes(flag.text, flag.ranges, (range) => {
                if (!matches(flag.text, range)) return null;
                return (
                    range.suggestions[0] ??
                    matchCase(
                        flag.text.slice(range.start, range.end),
                        groupSuggestion
                    )
                );
            });
            if (!fixed) continue;
            this.#write(row, column, fixed.text);
            if (fixed.ranges.length > 0) {
                this.#flags.set(cell, fixed);
            } else {
                this.#flags.delete(cell);
            }
            edits.push({ row, column, before: flag.text, after: fixed.text });
        }
        this.history.push(edits);
        return edits;
    }

    /**
     * Drop one flagged occurrence: this word, in this cell only. It stays
     * flagged everywhere else, so no re-check is needed — the caller only
     * persists the sheet. Returns false when it was already dismissed.
     */
    dismissWord(row: number, column: number, word: string): boolean {
        const key = dismissalKey(row, column, word);
        if (this.dismissedWords.has(key)) return false;
        this.dismissedWords.add(key);
        const cell = cellKey(row, column);
        const flag = this.#flags.get(cell);
        if (!flag) return true;
        const ranges = this.#keptRanges(row, column, flag.text, [
            ...flag.ranges
        ]);
        if (ranges.length > 0) this.#flags.set(cell, { ...flag, ranges });
        else this.#flags.delete(cell);
        return true;
    }

    /** A cell's ranges, minus the words dismissed in that cell. */
    #keptRanges(
        row: number,
        column: number,
        text: string,
        ranges: WordFlag[]
    ): WordFlag[] {
        if (this.dismissedWords.size === 0) return ranges;
        return ranges.filter(
            ({ start, end }) =>
                !this.dismissedWords.has(
                    dismissalKey(row, column, text.slice(start, end))
                )
        );
    }

    /**
     * The languages a cell's words were checked against, the one matching the
     * most words first. Until a check records what matched, that is just the
     * column's own language.
     */
    cellLanguages(row: number, column: number): LanguageCode[] {
        const counts = this.#cellLanguages.get(cellKey(row, column));
        if (counts) return counts.map(([language]) => language);
        const language = this.languages[column];
        return language !== undefined && isLanguageCode(language)
            ? [language]
            : [];
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

    /** Replace all flags, and the per-cell languages, with a full-sheet result. */
    applySheetFlags(
        flags: readonly CellFlags[],
        languages: readonly CellLanguages[] = []
    ) {
        this.#cellLanguages.clear();
        for (const { row, column, counts } of languages) {
            this.#cellLanguages.set(cellKey(row, column), counts);
        }
        for (const key of [...this.#flags.keys()]) {
            if (!this.#changedDuringCheck.has(key)) this.#flags.delete(key);
        }
        for (const flag of flags) {
            const key = cellKey(flag.row, flag.column);
            if (this.#changedDuringCheck.has(key)) continue;
            // Stale: the cell changed after the worker read it.
            if (this.cellValue(flag.row, flag.column) !== flag.text) continue;
            const ranges = this.#keptRanges(flag.row, flag.column, flag.text, [
                ...flag.ranges
            ]);
            if (ranges.length === 0) continue;
            this.#flags.set(key, { text: flag.text, ranges });
        }
        this.#changedDuringCheck.clear();
        this.checkState = 'done';
        this.checkProgress = 1;
    }

    /** Apply a single-cell re-check, unless the cell has changed since. */
    applyCellFlags(
        cell: CellFlags,
        languages: readonly [LanguageCode, number][] = []
    ) {
        if (this.cellValue(cell.row, cell.column) !== cell.text) return;
        const key = cellKey(cell.row, cell.column);
        if (languages.length > 1) this.#cellLanguages.set(key, [...languages]);
        else this.#cellLanguages.delete(key);
        const ranges = this.#keptRanges(cell.row, cell.column, cell.text, [
            ...cell.ranges
        ]);
        if (ranges.length > 0) {
            this.#flags.set(key, { text: cell.text, ranges });
        } else this.#flags.delete(key);
    }

    #write(row: number, column: number, value: string) {
        const key = cellKey(row, column);
        this.#overrides.set(key, value);
        this.edited.add(key);
        if (this.checkState === 'checking') this.#changedDuringCheck.add(key);
    }
}
