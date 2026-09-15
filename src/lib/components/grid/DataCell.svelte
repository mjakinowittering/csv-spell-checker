<script lang="ts">
    import type { ICellProps } from 'wx-svelte-grid';

    import { columnIndexOf } from './grid-context';
    import SheetCellText from './SheetCellText.svelte';

    let { row, column }: ICellProps = $props();

    // Grid row ids are sheet row indexes: row 0 is the header, so data rows
    // start at 1.
    const rowIndex = $derived(Number(row.id));
    const columnIndex = $derived(columnIndexOf(column.id) ?? 0);
</script>

<SheetCellText row={rowIndex} column={columnIndex} />
