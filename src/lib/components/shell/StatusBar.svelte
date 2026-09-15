<script lang="ts">
    import { m } from '$lib/paraglide/messages';

    let {
        rowCount,
        legend = false
    }: {
        rowCount: number | null;
        legend?: boolean;
    } = $props();
</script>

<footer
    class="bg-background text-muted-foreground flex h-7 shrink-0 items-center gap-4 border-t px-3 text-xs"
>
    {#if rowCount !== null}
        <span aria-live="polite">{m.status_rows({ count: rowCount })}</span>
    {/if}
    {#if legend}
        <span class="bg-border h-3 w-px" aria-hidden="true"></span>
        <span class="flex items-center gap-1.5">
            <span
                aria-hidden="true"
                class="sheet-cell-flagged-sample rounded-sm px-1 leading-4"
            >
                abc
            </span>
            {m.status_legend_flagged()}
        </span>
        <span class="flex items-center gap-1.5">
            <span
                aria-hidden="true"
                class="sheet-cell-edited size-3 rounded-sm border"
            ></span>
            {m.status_legend_edited()}
        </span>
    {/if}
</footer>
