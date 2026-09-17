<script lang="ts">
    import { mode } from 'mode-watcher';
    import type { Attachment } from 'svelte/attachments';
    import {
        Grid,
        Willow,
        WillowDark,
        type IApi,
        type IColumn,
        type IColumnConfig,
        type IRow
    } from 'wx-svelte-grid';

    import { columnLetter } from '$lib/grid/coordinates';
    import { m } from '$lib/paraglide/messages';
    import type { Sheet } from '$lib/workbook/sheet.svelte';

    import CornerHeaderCell from './CornerHeaderCell.svelte';
    import DataCell from './DataCell.svelte';
    import {
        columnId,
        columnIndexOf,
        ROW_NUMBER_COLUMN,
        setGridContext
    } from './grid-context';
    import HeaderValueCell from './HeaderValueCell.svelte';
    import RowNumberCell from './RowNumberCell.svelte';

    let {
        sheet,
        oneditcell
    }: {
        sheet: Sheet;
        oneditcell: (row: number, column: number) => void;
    } = $props();

    setGridContext({
        get sheet() {
            return sheet;
        }
    });

    let api: IApi | null = null;

    const split = { left: 1 };
    const sizes = { rowHeight: 32, headerHeight: 32, columnWidth: 160 };

    // Header row 1: column letters. Header row 2: the CSV header, which is
    // spreadsheet row 1 — bold, and frozen because the grid header never
    // scrolls. The first column is the frozen row numbers.
    const columns = $derived<IColumnConfig[]>([
        {
            id: ROW_NUMBER_COLUMN,
            width: 52,
            header: [
                { cell: CornerHeaderCell, css: 'sheet-corner' },
                { text: '1', css: 'sheet-row-number' }
            ],
            cell: RowNumberCell
        },
        ...(sheet.rows[0] ?? []).map((_, index) => ({
            id: columnId(index),
            resize: true,
            header: [
                { text: columnLetter(index), css: 'sheet-letter' },
                { cell: HeaderValueCell }
            ],
            cell: DataCell
        }))
    ]);

    // Grid rows carry only an id — the sheet row index. Cell components read
    // values from the sheet, so edits never reinitialise the grid.
    const data = $derived<IRow[]>(
        Array.from({ length: Math.max(sheet.rows.length - 1, 0) }, (_, i) => ({
            id: i + 1
        }))
    );

    function columnStyle(column: IColumn): string {
        return column.id === ROW_NUMBER_COLUMN ? 'sheet-row-number' : '';
    }

    function openFocusedCell() {
        const focus = api?.getState().focusCell;
        if (!focus) return;
        const column = columnIndexOf(focus.column);
        if (column !== null) oneditcell(Number(focus.row), column);
    }

    const hotkeys = { enter: openFocusedCell, f2: openFocusedCell };

    function initGrid(gridApi: IApi) {
        api = gridApi;
        // The status bar shows the focused cell and its column's language.
        gridApi.on('focus-cell', ({ row, column }) => {
            const index = column === undefined ? null : columnIndexOf(column);
            if (row === undefined || index === null) return;
            sheet.selectedCell = { row: Number(row), column: index };
        });
    }

    // Issue navigation: bring the current issue into view. Body cells also
    // get keyboard focus, so Enter opens the issue in the editor. The header
    // row never scrolls vertically, so it only needs horizontal scrolling.
    // (Calls into the grid's API only; no Svelte state is written here.)
    $effect(() => {
        const target = sheet.currentIssue;
        const grid = api;
        if (!target || !grid) return;
        const column = columnId(target.column);
        if (target.row === 0) {
            grid.exec('scroll', { column });
            return;
        }
        const row = target.row;
        let frame = 0;
        grid.exec('scroll', { row, column }).then(() => {
            // A row scrolled into view only renders on the next frame, and
            // the grid can only focus a rendered cell.
            frame = requestAnimationFrame(() =>
                grid.exec('focus-cell', {
                    row,
                    column,
                    eventSource: 'navigation'
                })
            );
        });
        return () => cancelAnimationFrame(frame);
    });

    // One listener for every cell (header row included). Cell components fill
    // their cell and carry their sheet coordinates, so no control lives inside
    // a cell and cells stay read-only at rest.
    const delegateCellClicks: Attachment<HTMLElement> = (node) => {
        function onclick(event: MouseEvent) {
            if (!(event.target instanceof Element)) return;
            const cell = event.target.closest<HTMLElement>('[data-sheet-row]');
            if (!cell || !node.contains(cell)) return;
            const row = Number(cell.dataset.sheetRow);
            const column = Number(cell.dataset.sheetColumn);
            // The header row never takes grid focus, so select it here too.
            sheet.selectedCell = { row, column };
            oneditcell(row, column);
        }
        node.addEventListener('click', onclick);
        return () => node.removeEventListener('click', onclick);
    };
</script>

{#snippet grid()}
    <Grid
        {data}
        {columns}
        {columnStyle}
        {split}
        {sizes}
        {hotkeys}
        select={false}
        init={initGrid}
    />
{/snippet}

<div
    class="sheet-grid h-full"
    role="region"
    aria-label={m.grid_label()}
    {@attach delegateCellClicks}
>
    {#if mode.current === 'dark'}
        <WillowDark fonts={false}>{@render grid()}</WillowDark>
    {:else}
        <Willow fonts={false}>{@render grid()}</Willow>
    {/if}
</div>

<style>
    /* Map the grid theme onto the app's tokens so it follows light/dark. */
    .sheet-grid :global(.wx-willow-theme),
    .sheet-grid :global(.wx-willow-dark-theme) {
        --wx-font-family: inherit;
        --wx-font-size: 13px;
        --wx-background: var(--background);
        --wx-background-alt: var(--muted);
        --wx-background-hover: var(--accent);
        --wx-color-font: var(--foreground);
        --wx-color-font-alt: var(--muted-foreground);
        --wx-color-primary: var(--ring);
        --wx-border-color: var(--border);
        --wx-border: 1px solid var(--border);
        --wx-table-border: 1px solid var(--border);
        --wx-table-header-background: var(--muted);
        --wx-table-header-border: var(--wx-table-border);
        --wx-table-header-cell-border: var(--wx-table-border);
        --wx-table-cell-border: var(--wx-table-border);
        --wx-table-fixed-column-border: 1px solid var(--border);
        --wx-table-select-background: var(--accent);
        --wx-header-font-weight: 400;
    }

    /* Cell components fill their cell: the whole cell is the click target. */
    .sheet-grid :global(.wx-cell:has(> .sheet-cell)) {
        padding: 0;
    }

    /* Column letters and row numbers are spreadsheet chrome. */
    .sheet-grid :global(.wx-cell.sheet-letter),
    .sheet-grid :global(.wx-cell.sheet-corner),
    .sheet-grid :global(.wx-cell.sheet-row-number) {
        justify-content: center;
        background: var(--muted);
        color: var(--muted-foreground);
        font-size: 12px;
    }

    /* The CSV header row is data, so it sits on the page background. */
    .sheet-grid :global(.wx-cell:has(> .sheet-cell[data-sheet-row='0'])) {
        background: var(--background);
    }

    /* SVAR sizes its table box to the total column width, which leaves the
       grid — and its vertical scrollbar — short of the container's right edge
       unless a column is flexible. Stretch the box instead, so column widths
       stay as configured and the empty space falls after the last column.
       Its own width is inline, hence !important, and content-box plus a 1px
       border would overflow by 2px. */
    .sheet-grid :global(.wx-table-box) {
        width: 100% !important;
        box-sizing: border-box;
    }
</style>
