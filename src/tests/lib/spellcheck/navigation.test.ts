import { describe, expect, it } from 'vitest';

import { adjacentIssue } from '$lib/spellcheck/navigation';

const cells = [
    { row: 0, column: 2 },
    { row: 1, column: 1 },
    { row: 1, column: 3 },
    { row: 4, column: 0 }
];

describe('adjacentIssue', () => {
    it('returns null when nothing is flagged', () => {
        expect(adjacentIssue([], null, 'next')).toBeNull();
        expect(adjacentIssue([], { row: 1, column: 1 }, 'previous')).toBeNull();
    });

    it('starts from the first or last issue with no current position', () => {
        expect(adjacentIssue(cells, null, 'next')).toEqual({
            row: 0,
            column: 2
        });
        expect(adjacentIssue(cells, null, 'previous')).toEqual({
            row: 4,
            column: 0
        });
    });

    it('moves in reading order: across a row, then down', () => {
        expect(adjacentIssue(cells, { row: 1, column: 1 }, 'next')).toEqual({
            row: 1,
            column: 3
        });
        expect(adjacentIssue(cells, { row: 1, column: 3 }, 'next')).toEqual({
            row: 4,
            column: 0
        });
        expect(adjacentIssue(cells, { row: 1, column: 1 }, 'previous')).toEqual(
            { row: 0, column: 2 }
        );
    });

    it('wraps around at either end', () => {
        expect(adjacentIssue(cells, { row: 4, column: 0 }, 'next')).toEqual({
            row: 0,
            column: 2
        });
        expect(adjacentIssue(cells, { row: 0, column: 2 }, 'previous')).toEqual(
            { row: 4, column: 0 }
        );
    });

    it('continues from a position that is no longer flagged', () => {
        // The issue at row 1, column 2 was just fixed.
        expect(adjacentIssue(cells, { row: 1, column: 2 }, 'next')).toEqual({
            row: 1,
            column: 3
        });
        expect(adjacentIssue(cells, { row: 1, column: 2 }, 'previous')).toEqual(
            { row: 1, column: 1 }
        );
    });

    it('stays on the only issue', () => {
        const only = [{ row: 2, column: 2 }];
        expect(adjacentIssue(only, { row: 2, column: 2 }, 'next')).toEqual({
            row: 2,
            column: 2
        });
    });
});
