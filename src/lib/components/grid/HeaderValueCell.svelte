<script lang="ts">
    import type { IHeaderCellProps } from 'wx-svelte-grid';

    import { columnIndexOf, getGridContext } from './grid-context';

    let { column }: IHeaderCellProps = $props();

    const { sheet } = getGridContext();

    // The CSV header is sheet row 0, shown as the frozen, bold spreadsheet
    // row 1. It is a cell like any other: editable through the same dialog.
    const columnIndex = $derived(columnIndexOf(column.id) ?? 0);
    const value = $derived(sheet.cellValue(0, columnIndex));
    const edited = $derived(sheet.isEdited(0, columnIndex));
</script>

<span
    data-sheet-row={0}
    data-sheet-column={columnIndex}
    class={[
        'sheet-cell block h-full w-full cursor-cell truncate px-2 leading-8 font-semibold',
        edited && 'sheet-cell-edited'
    ]}
>
    {value}
</span>
