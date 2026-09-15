<script lang="ts">
    import { segments } from '$lib/spellcheck/segments';

    import { getGridContext } from './grid-context';

    let {
        row,
        column,
        header = false
    }: {
        row: number;
        column: number;
        header?: boolean;
    } = $props();

    const { sheet } = getGridContext();

    const value = $derived(sheet.cellValue(row, column));
    const edited = $derived(sheet.isEdited(row, column));
    const ranges = $derived(sheet.flagRanges(row, column));
    const parts = $derived(ranges ? segments(value, ranges) : null);
    const current = $derived(
        sheet.currentIssue?.row === row && sheet.currentIssue.column === column
    );
</script>

<!-- Fills the cell so a click anywhere in it opens the editor. Edited tint
     and flag ring are independent: a cell can show both. -->
<span
    data-sheet-row={row}
    data-sheet-column={column}
    aria-current={current ? 'location' : undefined}
    class={[
        'sheet-cell block h-full w-full cursor-cell truncate px-2 leading-8',
        header && 'font-semibold',
        edited && 'sheet-cell-edited',
        parts && 'sheet-cell-flagged',
        current && 'sheet-cell-current'
    ]}
>
    {#if parts}
        {#each parts as part, index (index)}
            {#if part.misspelled}
                <span class="sheet-misspelling">{part.text}</span>
            {:else}
                {part.text}
            {/if}
        {/each}
    {:else}
        {value}
    {/if}
</span>
