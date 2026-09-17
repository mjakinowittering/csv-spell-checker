<script lang="ts">
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

    import LanguageFlags from '$lib/components/languages/LanguageFlags.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';

    import { cellReference } from '$lib/grid/coordinates';
    import { m } from '$lib/paraglide/messages';
    import type { FixTarget } from '$lib/workbook/sheet.svelte';

    /** Enough mixed cells to show the risk without filling the dialog. */
    const LISTED = 6;

    let {
        word,
        suggestion,
        single,
        mixed,
        onconfirm,
        oncancel
    }: {
        word: string;
        suggestion: string;
        /** Cells whose words all matched their column's language. */
        single: readonly FixTarget[];
        /** Cells where another language matched some words too. */
        mixed: readonly FixTarget[];
        onconfirm: (scope: 'single' | 'all') => void;
        oncancel: () => void;
    } = $props();

    const listed = $derived(mixed.slice(0, LISTED));
    const hidden = $derived(mixed.length - listed.length);
</script>

<Dialog.Header>
    <Dialog.Title>{m.bulk_fix_title({ word, suggestion })}</Dialog.Title>
    <Dialog.Description>
        {single.length === 1
            ? m.bulk_fix_single_summary_one()
            : m.bulk_fix_single_summary({ count: single.length })}
    </Dialog.Description>
</Dialog.Header>

<div class="flex flex-col gap-2 text-sm">
    <p
        class="flex items-start gap-1.5 text-amber-800 dark:text-amber-300"
        data-mixed-warning
    >
        <TriangleAlertIcon aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
        <span>
            {mixed.length === 1
                ? m.bulk_fix_mixed_summary_one()
                : m.bulk_fix_mixed_summary({ count: mixed.length })}
            {m.bulk_fix_mixed_warning()}
        </span>
    </p>

    <ul class="-mx-1 max-h-[40vh] divide-y overflow-y-auto px-1">
        {#each listed as target (`${target.row}:${target.column}`)}
            <li
                data-mixed-cell={cellReference(target.row, target.column)}
                class="flex items-center gap-2 py-1.5"
            >
                <span class="text-muted-foreground w-12 shrink-0 tabular-nums">
                    {cellReference(target.row, target.column)}
                </span>
                <span class="min-w-0 flex-1 truncate">{target.text}</span>
                <LanguageFlags
                    languages={target.languages}
                    showCode={false}
                    size="xs"
                />
            </li>
        {/each}
    </ul>
    {#if hidden > 0}
        <p class="text-muted-foreground">
            {m.bulk_fix_more({ count: hidden })}
        </p>
    {/if}
</div>

<Dialog.Footer class="flex-wrap">
    <Button variant="outline" onclick={oncancel}>
        {m.bulk_fix_cancel_action()}
    </Button>
    <Button variant="outline" onclick={() => onconfirm('all')}>
        {m.bulk_fix_all_action({ count: single.length + mixed.length })}
    </Button>
    <!-- With every affected cell mixed, there is no safer subset to offer. -->
    {#if single.length > 0}
        <Button onclick={() => onconfirm('single')}>
            {single.length === 1
                ? m.bulk_fix_single_action_one()
                : m.bulk_fix_single_action({ count: single.length })}
        </Button>
    {/if}
</Dialog.Footer>
