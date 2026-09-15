<script lang="ts">
    import WordSuggestion from '$lib/components/issues/WordSuggestion.svelte';
    import { Button } from '$lib/components/ui/button';

    import { m } from '$lib/paraglide/messages';
    import type { CellIssue } from '$lib/workbook/sheet.svelte';

    let {
        issues,
        onfix,
        onignore
    }: {
        /** The cell's distinct flagged words, each with its top suggestion. */
        issues: readonly CellIssue[];
        /** Accept the suggestion in this cell only. */
        onfix: (issue: CellIssue) => void;
        /** Ignore a word for the whole sheet. */
        onignore: (word: string) => void;
    } = $props();

    const titleId = $props.id();
</script>

{#if issues.length > 0}
    <div class="flex flex-col gap-2">
        <span class="text-sm font-medium" id={titleId}>
            {m.editor_issues_title()}
        </span>
        <ul aria-labelledby={titleId} class="divide-y rounded-md border">
            {#each issues as issue (issue.key)}
                <li
                    data-issue-word={issue.word}
                    class="flex items-center gap-2 py-1.5 pr-1.5 pl-3 text-sm"
                >
                    <div class="min-w-0 flex-1">
                        <WordSuggestion
                            word={issue.word}
                            suggestion={issue.suggestion}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={issue.suggestion === null}
                        aria-label={issue.suggestion === null
                            ? undefined
                            : m.editor_fix_word_hint({
                                  word: issue.word,
                                  suggestion: issue.suggestion
                              })}
                        onclick={() => onfix(issue)}
                    >
                        {m.editor_fix_action()}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-label={m.editor_ignore_word_hint({
                            word: issue.word
                        })}
                        onclick={() => onignore(issue.word)}
                    >
                        {m.editor_ignore_action()}
                    </Button>
                </li>
            {/each}
        </ul>
    </div>
{/if}
