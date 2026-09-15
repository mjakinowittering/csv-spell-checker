import type { CellPosition } from '$lib/workbook/sheet.svelte';

export type IssueDirection = 'next' | 'previous';

function compare(a: CellPosition, b: CellPosition): number {
    return a.row - b.row || a.column - b.column;
}

/**
 * The flagged cell after (or before) `from` in reading order — row by row,
 * left to right — wrapping around at either end. `from` need not itself be
 * flagged, so navigation continues sensibly after its issue is fixed.
 *
 * `cells` must already be in reading order.
 */
export function adjacentIssue(
    cells: readonly CellPosition[],
    from: CellPosition | null,
    direction: IssueDirection
): CellPosition | null {
    if (cells.length === 0) return null;
    const first = cells[0];
    const last = cells[cells.length - 1];

    if (direction === 'next') {
        if (!from) return first;
        return cells.find((cell) => compare(cell, from) > 0) ?? first;
    }

    if (!from) return last;
    return cells.findLast((cell) => compare(cell, from) < 0) ?? last;
}
