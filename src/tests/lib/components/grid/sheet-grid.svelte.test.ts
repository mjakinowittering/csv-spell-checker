import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import SheetGrid from '$lib/components/grid/SheetGrid.svelte';

import { Sheet } from '$lib/workbook/sheet.svelte';

function readySheet(): Sheet {
    const sheet = new Sheet('Sheet 1');
    sheet.rows = [
        ['First Name', 'Last Name'],
        ['Sarah', 'Jenkins'],
        ['Tom', 'Blake']
    ];
    sheet.phase = {
        kind: 'confirming',
        guess: {
            detected: 'en',
            prefill: 'en-GB',
            confidence: 1,
            confident: true,
            source: 'franc'
        }
    };
    sheet.confirmLanguages(['en-GB', 'en-GB']);
    return sheet;
}

// The grid virtualises rows, so it needs a container with a real size.
function sizedTarget(): HTMLElement {
    const target = document.createElement('div');
    target.style.cssText = 'height: 400px; width: 900px;';
    document.body.append(target);
    return target;
}

function cellAt(target: HTMLElement, row: number, column: number) {
    return target.querySelector<HTMLElement>(
        `[data-sheet-row="${row}"][data-sheet-column="${column}"]`
    );
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('SheetGrid', () => {
    it('shows an edit and its tint without remounting', async () => {
        const sheet = readySheet();
        const target = sizedTarget();
        await render(SheetGrid, {
            target,
            props: { sheet, oneditcell: () => {} }
        });

        await expect
            .poll(() => cellAt(target, 2, 1)?.textContent?.trim())
            .toBe('Blake');

        sheet.editCell(2, 1, 'Blakes');
        flushSync();

        await expect
            .poll(() => cellAt(target, 2, 1)?.textContent?.trim())
            .toBe('Blakes');
        expect(
            cellAt(target, 2, 1)?.classList.contains('sheet-cell-edited')
        ).toBe(true);
    });

    it('shows the flag ring instead of the edited style until the cell is clean', async () => {
        const sheet = readySheet();
        const target = sizedTarget();
        await render(SheetGrid, {
            target,
            props: { sheet, oneditcell: () => {} }
        });
        await expect.poll(() => cellAt(target, 2, 1)).not.toBeNull();

        sheet.editCell(2, 1, 'Blaeks');
        sheet.applyCellFlags({
            row: 2,
            column: 1,
            text: 'Blaeks',
            ranges: [{ start: 0, end: 6 }]
        });
        flushSync();

        const cell = () => cellAt(target, 2, 1);
        await expect
            .poll(() => cell()?.classList.contains('sheet-cell-flagged'))
            .toBe(true);
        expect(cell()?.classList.contains('sheet-cell-edited')).toBe(false);
        expect(cell()?.hasAttribute('data-edited')).toBe(true);

        sheet.editCell(2, 1, 'Blakes');
        sheet.applyCellFlags({ row: 2, column: 1, text: 'Blakes', ranges: [] });
        flushSync();

        await expect
            .poll(() => cell()?.classList.contains('sheet-cell-edited'))
            .toBe(true);
        expect(cell()?.classList.contains('sheet-cell-flagged')).toBe(false);
    });

    it('updates the header row after an edit', async () => {
        const sheet = readySheet();
        const target = sizedTarget();
        await render(SheetGrid, {
            target,
            props: { sheet, oneditcell: () => {} }
        });

        sheet.editCell(0, 0, 'Given Name');
        flushSync();

        await expect
            .poll(() => cellAt(target, 0, 0)?.textContent?.trim())
            .toBe('Given Name');
    });

    it('reports clicks with sheet coordinates, header row included', async () => {
        const sheet = readySheet();
        const target = sizedTarget();
        const clicks: [number, number][] = [];
        await render(SheetGrid, {
            target,
            props: {
                sheet,
                oneditcell: (row: number, column: number) =>
                    clicks.push([row, column])
            }
        });

        await expect.poll(() => cellAt(target, 2, 1)).not.toBeNull();
        cellAt(target, 2, 1)?.click();
        cellAt(target, 0, 1)?.click();

        expect(clicks).toEqual([
            [2, 1],
            [0, 1]
        ]);
    });
});
