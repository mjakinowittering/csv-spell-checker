<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';

    import { m } from '$lib/paraglide/messages';
    import type { FlaggedWord } from '$lib/workbook/sheet.svelte';

    let {
        open = $bindable(false),
        words,
        onignore
    }: {
        open?: boolean;
        /** Deduplicated flagged words with their occurrence counts. */
        words: readonly FlaggedWord[];
        /** Ignore a word for the whole sheet. */
        onignore: (word: string) => void;
    } = $props();
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
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
                {#each words as { key, word, count } (key)}
                    <li
                        data-flagged-word={key}
                        class="flex items-center gap-3 py-2"
                    >
                        <span class="min-w-0 flex-1 truncate font-medium">
                            {word}
                        </span>
                        <span class="text-muted-foreground shrink-0 text-sm">
                            {count === 1
                                ? m.flagged_words_count_one()
                                : m.flagged_words_count({ count })}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            aria-label={m.flagged_words_ignore_hint({ word })}
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
    </Dialog.Content>
</Dialog.Root>
