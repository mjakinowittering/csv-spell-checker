<script lang="ts">
    import type { ICellProps } from 'wx-svelte-grid';

    import { columnIndexOf, getGridContext } from './grid-context';

    let { row, column }: ICellProps = $props();

    const { sheet } = getGridContext();

    // Grid row ids are sheet row indexes: row 0 is the header, so data rows
    // start at 1.
    const rowIndex = $derived(Number(row.id));
    const columnIndex = $derived(columnIndexOf(column.id) ?? 0);
    const value = $derived(sheet.cellValue(rowIndex, columnIndex));
    const edited = $derived(sheet.isEdited(rowIndex, columnIndex));
</script>

<span
    data-sheet-row={rowIndex}
    data-sheet-column={columnIndex}
    class={[
        'sheet-cell block h-full w-full cursor-cell truncate px-2 leading-8',
        edited && 'sheet-cell-edited'
    ]}
>
    {value}
</span>
