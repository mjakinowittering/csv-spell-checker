<script lang="ts">
    import { m } from '$lib/paraglide/messages';

    let { rowCount }: { rowCount: number | null } = $props();
</script>

<footer
    class="bg-background text-muted-foreground flex h-7 shrink-0 items-center border-t px-3 text-xs"
>
    {#if rowCount !== null}
        <span aria-live="polite">{m.status_rows({ count: rowCount })}</span>
    {/if}
</footer>
