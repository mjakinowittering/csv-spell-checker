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

<!-- Fills the cell so a click anywhere in it opens the editor. A flagged
     cell always shows its red ring and squiggles, edited or not; the green
     edited style only shows once an edited cell has no issues. -->
<span
    data-sheet-row={row}
    data-sheet-column={column}
    data-edited={edited ? '' : undefined}
    aria-current={current ? 'location' : undefined}
    class={[
        'sheet-cell block h-full w-full cursor-cell truncate px-2 leading-8',
        header && 'font-semibold',
        edited && !parts && 'sheet-cell-edited',
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
