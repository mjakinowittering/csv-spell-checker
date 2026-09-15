<script lang="ts">
    import type { IHeaderCellProps } from 'wx-svelte-grid';

    import { columnIndexOf } from './grid-context';
    import SheetCellText from './SheetCellText.svelte';

    let { column }: IHeaderCellProps = $props();

    // The CSV header is sheet row 0, shown as the frozen, bold spreadsheet
    // row 1. It is a cell like any other: editable and spell-checked.
    const columnIndex = $derived(columnIndexOf(column.id) ?? 0);
</script>

<SheetCellText row={0} column={columnIndex} header />
