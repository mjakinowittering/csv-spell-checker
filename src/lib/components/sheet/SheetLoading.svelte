<script lang="ts">
    import { Progress } from '$lib/components/ui/progress';
    import { Spinner } from '$lib/components/ui/spinner';

    import { m } from '$lib/paraglide/messages';

    let { name, progress }: { name: string; progress: number } = $props();
</script>

<div
    class="flex h-full flex-col items-center justify-center gap-3 p-6"
    role="status"
>
    <Spinner stroke="currentColor" class="text-muted-foreground size-5" />
    <p class="text-sm font-medium">{m.import_reading_title({ name })}</p>
    <Progress
        value={Math.round(progress * 100)}
        aria-label={m.import_progress_label()}
        class="w-64 max-w-full"
    />
</div>
