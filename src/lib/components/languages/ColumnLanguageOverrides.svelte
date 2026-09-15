<script lang="ts">
    import { Badge } from '$lib/components/ui/badge';

    import { columnLetter } from '$lib/grid/coordinates';
    import type { ColumnLanguage } from '$lib/languages/codes';
    import { m } from '$lib/paraglide/messages';

    import LanguageSelect from './LanguageSelect.svelte';

    let {
        headers,
        languages = $bindable(),
        options,
        detected = null
    }: {
        headers: readonly string[];
        /** One entry per column; null while that column has no language yet. */
        languages: (ColumnLanguage | null)[];
        options: readonly ColumnLanguage[];
        detected?: string | null;
    } = $props();
</script>

<ul class="divide-y border-y">
    {#each headers as header, index (index)}
        {@const letter = columnLetter(index)}
        <li
            data-column-row
            class="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5"
        >
            <div class="flex min-w-0 flex-1 items-baseline gap-3">
                <span class="text-muted-foreground w-20 shrink-0 text-sm">
                    {m.languages_column_label({ letter })}
                </span>
                {#if header.trim() !== ''}
                    <span class="truncate text-sm font-medium">
                        {m.languages_column_header({ name: header })}
                    </span>
                {/if}
            </div>
            <div class="flex items-center gap-2">
                {#if languages[index] === 'unsupported'}
                    <Badge
                        variant="outline"
                        data-unsupported
                        class="border-amber-600/60 text-amber-800 dark:text-amber-300"
                    >
                        {m.languages_unsupported_badge()}
                    </Badge>
                {/if}
                <LanguageSelect
                    bind:value={languages[index]}
                    {options}
                    {detected}
                    size="sm"
                    class="w-56"
                    label={m.languages_select_label({ letter })}
                    placeholder={m.languages_sheet_placeholder()}
                />
            </div>
        </li>
    {/each}
</ul>
