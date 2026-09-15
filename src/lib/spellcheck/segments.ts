import type { MisspellingRange } from './tokenize';

export type TextSegment = { text: string; misspelled: boolean };

/** Split a cell's text into plain and misspelled runs, in order. */
export function segments(
    text: string,
    ranges: readonly MisspellingRange[]
): TextSegment[] {
    const result: TextSegment[] = [];
    let cursor = 0;

    for (const { start, end } of [...ranges].sort(
        (a, b) => a.start - b.start
    )) {
        if (start < cursor || end > text.length) continue;
        if (start > cursor) {
            result.push({ text: text.slice(cursor, start), misspelled: false });
        }
        result.push({ text: text.slice(start, end), misspelled: true });
        cursor = end;
    }

    if (cursor < text.length) {
        result.push({ text: text.slice(cursor), misspelled: false });
    }
    return result;
}
