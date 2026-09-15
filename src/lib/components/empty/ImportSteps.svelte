<script lang="ts">
    import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
    import Grid3x3Icon from '@lucide/svelte/icons/grid-3x3';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
    import UploadIcon from '@lucide/svelte/icons/upload';

    import { m } from '$lib/paraglide/messages';

    const steps = [
        { id: 'upload', icon: UploadIcon, title: m.empty_step_upload_title },
        { id: 'grid', icon: Grid3x3Icon, title: m.empty_step_grid_title },
        {
            id: 'flagged',
            icon: TriangleAlertIcon,
            title: m.empty_step_flagged_title
        }
    ] as const;
</script>

<ol
    aria-label={m.empty_steps_label()}
    class="flex w-full items-start justify-center gap-2 sm:gap-4"
>
    {#each steps as step, index (step.id)}
        {#if index > 0}
            <li aria-hidden="true" class="text-muted-foreground pt-3">
                <ArrowRightIcon class="size-4" />
            </li>
        {/if}
        <li class="flex w-24 flex-col items-center gap-2 text-center">
            <div
                class={[
                    'bg-background flex size-10 items-center justify-center rounded-lg border shadow-xs',
                    step.id === 'flagged' &&
                        'sheet-cell-flagged text-destructive'
                ]}
            >
                <step.icon class="size-5" />
            </div>
            <span class="text-xs font-medium">{step.title()}</span>
        </li>
    {/each}
</ol>
