<script lang="ts">
    import { Progress } from '$lib/components/ui/progress';

    import { m } from '$lib/paraglide/messages';

    let { progress }: { progress: number } = $props();

    const percent = $derived(Math.round(progress * 100));
</script>

<div
    class="flex h-full flex-col items-center justify-center gap-3 p-6"
    role="status"
>
    <p class="text-sm font-medium">{m.import_reading_title()}</p>
    <div class="flex w-72 max-w-full items-center gap-3">
        <Progress
            value={percent}
            aria-label={m.import_progress_label()}
            class="flex-1"
        />
        <span
            class="text-muted-foreground w-10 text-right text-xs tabular-nums"
        >
            {m.import_progress_value({ percent })}
        </span>
    </div>
    <p class="text-muted-foreground text-xs">
        {m.import_reading_description()}
    </p>
</div>
