<script lang="ts">
    import { isLanguageCode, type ColumnLanguage } from '$lib/languages/codes';
    import { languageFlag } from '$lib/languages/flags';
    import { columnLanguageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';

    let {
        rowCount,
        pending = false,
        selection = null,
        legend = false
    }: {
        rowCount: number | null;
        /** A sheet is still being read: its row count is not known yet. */
        pending?: boolean;
        /** The selected cell, in A1 notation, and its column's language. */
        selection?: { cell: string; language: ColumnLanguage } | null;
        legend?: boolean;
    } = $props();
</script>

<footer
    class="bg-background text-muted-foreground flex h-7 shrink-0 items-center gap-4 border-t px-3 text-xs"
>
    {#if rowCount !== null}
        <span aria-live="polite">{m.status_rows({ count: rowCount })}</span>
    {:else if pending}
        <span>{m.status_rows_pending()}</span>
    {/if}
    {#if selection}
        <span class="bg-border h-3 w-px" aria-hidden="true"></span>
        <span data-selected-cell class="flex min-w-0 items-center gap-1">
            <span class="truncate">
                {m.status_selected({
                    cell: selection.cell,
                    language: columnLanguageLabel(selection.language)
                })}
            </span>
            {#if isLanguageCode(selection.language)}
                <span aria-hidden="true" class="order-first leading-none">
                    {languageFlag[selection.language]}
                </span>
            {/if}
        </span>
    {/if}
    {#if legend}
        <span class="bg-border h-3 w-px max-sm:hidden" aria-hidden="true"
        ></span>
        <span class="flex items-center gap-1.5 max-sm:hidden">
            <span
                aria-hidden="true"
                class="sheet-cell-flagged-sample rounded-sm px-1 leading-4"
            >
                abc
            </span>
            {m.status_legend_flagged()}
        </span>
        <span class="flex items-center gap-1.5 max-sm:hidden">
            <span
                aria-hidden="true"
                class="sheet-cell-edited size-3 rounded-sm border"
            ></span>
            {m.status_legend_edited()}
        </span>
    {/if}
</footer>
