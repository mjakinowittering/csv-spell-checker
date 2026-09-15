import { createContext } from 'svelte';

import type { Sheet } from '$lib/workbook/sheet.svelte';

/** Shared with the cell components the grid instantiates. */
export type GridContext = {
    readonly sheet: Sheet;
};

export const [getGridContext, setGridContext] = createContext<GridContext>();

/** Grid id of the frozen row-number column. */
export const ROW_NUMBER_COLUMN = 'row-number';

/** Grid id for a sheet column. */
export function columnId(column: number): string {
    return `c${column}`;
}

/** Sheet column index for a grid column id, or null for the row numbers. */
export function columnIndexOf(id: string | number | undefined): number | null {
    if (typeof id !== 'string' || !id.startsWith('c')) return null;
    const index = Number(id.slice(1));
    return Number.isInteger(index) ? index : null;
}
