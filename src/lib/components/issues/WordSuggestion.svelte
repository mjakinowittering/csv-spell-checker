<script lang="ts">
    import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

    import { m } from '$lib/paraglide/messages';

    let {
        word,
        suggestion
    }: {
        /** The flagged word, as written. */
        word: string;
        /** Hunspell's top suggestion, or null when it has none. */
        suggestion: string | null;
    } = $props();
</script>

<!-- "Trés → très": the flagged word, squiggled, and what Fix would write. -->
<span class="flex min-w-0 items-center gap-1.5">
    <span
        class="decoration-destructive truncate font-medium underline decoration-wavy underline-offset-3"
    >
        {word}
    </span>
    <ArrowRightIcon
        aria-hidden="true"
        class="text-muted-foreground size-3.5 shrink-0"
    />
    {#if suggestion !== null}
        <span class="sr-only">{m.issues_suggestion_label()}</span>
        <span class="truncate">{suggestion}</span>
    {:else}
        <span class="text-muted-foreground truncate italic">
            {m.issues_no_suggestion()}
        </span>
    {/if}
</span>
