<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';

    import { m } from '$lib/paraglide/messages';
    import type {
        CellPosition,
        FixTarget,
        FlaggedWord
    } from '$lib/workbook/sheet.svelte';

    import BulkFixConfirm from './BulkFixConfirm.svelte';
    import WordSuggestion from './WordSuggestion.svelte';

    let {
        open = $bindable(false),
        words,
        fixTargets,
        onfix,
        onignore
    }: {
        open?: boolean;
        /** Deduplicated flagged words with suggestions and occurrence counts. */
        words: readonly FlaggedWord[];
        /** Every cell a fix of this word would rewrite. */
        fixTargets: (word: string) => readonly FixTarget[];
        /**
         * Replace a word with its suggestion across the sheet, or only in
         * `cells` when mixed-language cells have been left out.
         */
        onfix: (word: string, cells?: readonly CellPosition[]) => void;
        /** Ignore a word for the whole sheet. */
        onignore: (word: string) => void;
    } = $props();

    // A fix waiting on confirmation, because it would touch cells whose words
    // matched more than one language — where the column's dictionary is the
    // least likely to be right.
    let pending = $state<{ word: string; suggestion: string } | null>(null);
    const targets = $derived(pending ? [...fixTargets(pending.word)] : []);
    const mixed = $derived(targets.filter((target) => target.mixed));
    const single = $derived(targets.filter((target) => !target.mixed));

    function startFix(word: string, suggestion: string | null) {
        if (suggestion === null) return;
        // Nothing mixed, nothing to warn about: fix straight away.
        if (!fixTargets(word).some((target) => target.mixed)) {
            onfix(word);
            return;
        }
        pending = { word, suggestion };
    }

    function confirmFix(scope: 'single' | 'all') {
        const word = pending?.word;
        // Read the cells before clearing `pending`: `single` derives from it.
        const cells = single.map(({ row, column }) => ({ row, column }));
        pending = null;
        if (word === undefined) return;
        onfix(word, scope === 'all' ? undefined : cells);
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-xl">
        {#if pending}
            <BulkFixConfirm
                word={pending.word}
                suggestion={pending.suggestion}
                {single}
                {mixed}
                onconfirm={confirmFix}
                oncancel={() => (pending = null)}
            />
        {:else}
            <Dialog.Header>
                <Dialog.Title>{m.flagged_words_title()}</Dialog.Title>
                <Dialog.Description>
                    {m.flagged_words_description()}
                </Dialog.Description>
            </Dialog.Header>

            {#if words.length === 0}
                <p class="text-muted-foreground py-4 text-sm">
                    {m.flagged_words_empty()}
                </p>
            {:else}
                <ul class="-mx-1 max-h-[60vh] divide-y overflow-y-auto px-1">
                    {#each words as { key, word, count, suggestion } (key)}
                        <li
                            data-flagged-word={key}
                            class="flex items-center gap-2 py-1.5 text-sm"
                        >
                            <div class="min-w-0 flex-1">
                                <WordSuggestion {word} {suggestion} />
                            </div>
                            <span
                                class="text-muted-foreground shrink-0 pr-1 tabular-nums"
                            >
                                {count === 1
                                    ? m.flagged_words_count_one()
                                    : m.flagged_words_count({ count })}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={suggestion === null}
                                aria-label={suggestion === null
                                    ? undefined
                                    : m.flagged_words_fix_hint({
                                          word,
                                          suggestion
                                      })}
                                onclick={() => startFix(word, suggestion)}
                            >
                                {m.flagged_words_fix_action()}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label={m.flagged_words_ignore_hint({
                                    word
                                })}
                                onclick={() => onignore(word)}
                            >
                                {m.flagged_words_ignore_action()}
                            </Button>
                        </li>
                    {/each}
                </ul>
            {/if}

            <Dialog.Footer>
                <Button variant="outline" onclick={() => (open = false)}>
                    {m.flagged_words_close_action()}
                </Button>
            </Dialog.Footer>
        {/if}
    </Dialog.Content>
</Dialog.Root>
