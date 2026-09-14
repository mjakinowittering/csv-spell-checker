<script lang="ts">
    import { mode } from 'mode-watcher';
    import {
        Grid,
        Willow,
        WillowDark,
        type IColumnConfig,
        type IRow
    } from 'wx-svelte-grid';

    let { rows }: { rows: readonly string[][] } = $props();

    // The CSV header row is the grid's own header: bold, and frozen because
    // the grid never scrolls its header out of view.
    const columns = $derived<IColumnConfig[]>(
        (rows[0] ?? []).map((header, index) => ({
            id: `c${index}`,
            header,
            width: 160,
            resize: true
        }))
    );

    const data = $derived<IRow[]>(
        rows.slice(1).map((row, rowIndex) => {
            const record: IRow = { id: rowIndex + 1 };
            row.forEach((value, columnIndex) => {
                record[`c${columnIndex}`] = value;
            });
            return record;
        })
    );
</script>

<div class="h-full">
    {#if mode.current === 'dark'}
        <WillowDark fonts={false}>
            <Grid {data} {columns} select={false} />
        </WillowDark>
    {:else}
        <Willow fonts={false}>
            <Grid {data} {columns} select={false} />
        </Willow>
    {/if}
</div>
