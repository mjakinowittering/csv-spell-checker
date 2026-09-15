<script lang="ts">
    import XIcon from '@lucide/svelte/icons/x';

    import { Button } from '$lib/components/ui/button';

    import { m } from '$lib/paraglide/messages';

    let {
        words,
        onignore
    }: {
        /** The cell's distinct misspelled words. */
        words: readonly string[];
        /** Ignore a word for the whole sheet. */
        onignore: (word: string) => void;
    } = $props();
</script>

{#if words.length > 0}
    <div class="flex flex-col gap-2">
        <span class="text-sm font-medium" id="cell-issues-title">
            {m.editor_issues_title()}
        </span>
        <ul aria-labelledby="cell-issues-title" class="flex flex-wrap gap-1.5">
            {#each words as word (word)}
                <li>
                    <Button
                        variant="outline"
                        size="sm"
                        data-issue-word={word}
                        class="h-7 gap-1 rounded-full pr-2 font-normal"
                        aria-label={m.editor_ignore_word_hint({ word })}
                        onclick={() => onignore(word)}
                    >
                        <span
                            class="decoration-destructive underline decoration-wavy"
                        >
                            {word}
                        </span>
                        <XIcon
                            aria-hidden="true"
                            class="text-muted-foreground"
                        />
                    </Button>
                </li>
            {/each}
        </ul>
    </div>
{/if}
