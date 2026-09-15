<script lang="ts">
    import { setGridContext } from '$lib/components/grid/grid-context';
    import SheetCellText from '$lib/components/grid/SheetCellText.svelte';

    import { applyStoryFlags, storySheet } from './fixtures.svelte';

    let {
        value = 'Loves hikking',
        header = false,
        edited = false,
        flagged = true,
        current = false
    }: {
        value?: string;
        /** Render as the bold CSV header row. */
        header?: boolean;
        edited?: boolean;
        /** Apply the stand-in spellcheck, which flags words like "hikking". */
        flagged?: boolean;
        /** The issue reached with previous/next. */
        current?: boolean;
    } = $props();

    const row = $derived(header ? 0 : 1);

    // Cell components read their sheet from the grid context; a fresh sheet
    // per combination of controls, and the cell is re-created with it.
    const sheet = $derived.by(() => {
        const original = edited ? 'Original text' : value;
        const rows = header ? [[original], ['']] : [['Header'], [original]];
        const built = storySheet({
            rows,
            languages: ['en-GB'],
            flagged: false
        });
        if (edited) built.editCell(row, 0, value);
        if (flagged) applyStoryFlags(built);
        if (current) built.currentIssue = { row, column: 0 };
        return built;
    });

    setGridContext({
        get sheet() {
            return sheet;
        }
    });
</script>

<div class="bg-background h-8 w-64 border">
    {#key sheet}
        <SheetCellText {row} column={0} {header} />
    {/key}
</div>
