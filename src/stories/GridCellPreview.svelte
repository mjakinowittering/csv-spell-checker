<script lang="ts">
    import type { ICellProps, IColumn, IHeaderCellProps } from 'wx-svelte-grid';

    import CornerHeaderCell from '$lib/components/grid/CornerHeaderCell.svelte';
    import DataCell from '$lib/components/grid/DataCell.svelte';
    import {
        columnId,
        setGridContext
    } from '$lib/components/grid/grid-context';
    import HeaderValueCell from '$lib/components/grid/HeaderValueCell.svelte';
    import RowNumberCell from '$lib/components/grid/RowNumberCell.svelte';

    import { storySheet } from './fixtures.svelte';

    let {
        cell = 'data',
        row = 1,
        column = 1
    }: {
        /** Which of the grid's cell components to show. */
        cell?: 'data' | 'header' | 'row-number' | 'corner';
        /** Sheet row index (0 is the header). */
        row?: number;
        column?: number;
    } = $props();

    // The sample sheet, with its stand-in flags and one edit.
    const sheet = storySheet({
        edits: [[2, 1, 'Enjoys long walks by the sea']]
    });
    setGridContext({ sheet });

    // The grid passes these to every cell component; ours only read ids.
    const api = {} as ICellProps['api'];
    const headerCell = {} as IHeaderCellProps['cell'];
    const gridColumn = $derived({ id: columnId(column) } as IColumn);
    function onaction() {}
</script>

<div class="bg-background flex h-8 w-64 items-center border">
    {#if cell === 'data'}
        <DataCell {api} {onaction} row={{ id: row }} column={gridColumn} />
    {:else if cell === 'header'}
        <HeaderValueCell
            {api}
            {onaction}
            row={0}
            column={gridColumn}
            cell={headerCell}
        />
    {:else if cell === 'row-number'}
        <RowNumberCell {api} {onaction} row={{ id: row }} column={gridColumn} />
    {:else}
        <CornerHeaderCell
            {api}
            {onaction}
            row={0}
            column={{ id: 'row-number' } as IColumn}
            cell={headerCell}
        />
    {/if}
</div>
