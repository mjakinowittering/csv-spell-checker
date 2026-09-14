<script lang="ts">
    import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
    import Grid3x3Icon from '@lucide/svelte/icons/grid-3x3';
    import SpellCheckIcon from '@lucide/svelte/icons/spell-check';
    import UploadIcon from '@lucide/svelte/icons/upload';
    import type { Snippet } from 'svelte';

    import { Badge } from '$lib/components/ui/badge';
    import * as Empty from '$lib/components/ui/empty';

    import { LANGUAGE_CODES } from '$lib/languages/codes';
    import { languageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';

    let { actions }: { actions?: Snippet } = $props();

    const steps = [
        {
            id: 'upload',
            icon: UploadIcon,
            title: m.empty_step_upload_title,
            description: m.empty_step_upload_description
        },
        {
            id: 'grid',
            icon: Grid3x3Icon,
            title: m.empty_step_grid_title,
            description: m.empty_step_grid_description
        },
        {
            id: 'flagged',
            icon: SpellCheckIcon,
            title: m.empty_step_flagged_title,
            description: m.empty_step_flagged_description
        }
    ] as const;
</script>

<Empty.Root class="h-full justify-start overflow-y-auto sm:justify-center">
    <Empty.Header class="max-w-lg">
        <Empty.Media variant="icon">
            <SpellCheckIcon />
        </Empty.Media>
        <Empty.Title>{m.empty_title()}</Empty.Title>
        <Empty.Description>{m.empty_description()}</Empty.Description>
    </Empty.Header>

    <Empty.Content class="max-w-2xl gap-8">
        {@render actions?.()}

        <ol
            aria-label={m.empty_steps_label()}
            class="grid w-full gap-6 sm:grid-cols-3 sm:gap-4"
        >
            {#each steps as step, index (step.id)}
                <li
                    class="relative flex flex-col items-center gap-2 text-center"
                >
                    {#if index > 0}
                        <ArrowRightIcon
                            aria-hidden="true"
                            class="text-muted-foreground absolute top-3 -left-4 hidden size-4 -translate-x-1/2 sm:block"
                        />
                    {/if}
                    <div
                        class="bg-background flex size-10 items-center justify-center rounded-lg border shadow-xs"
                    >
                        <step.icon class="size-5" />
                    </div>
                    <span class="text-sm font-medium">{step.title()}</span>
                    <span class="text-muted-foreground text-xs text-balance">
                        {step.description()}
                    </span>
                    {#if step.id === 'flagged'}
                        <span
                            class="bg-background ring-destructive/40 rounded-sm px-2 py-0.5 text-xs ring-2"
                        >
                            <span
                                class="decoration-destructive underline decoration-wavy underline-offset-4"
                            >
                                {m.empty_step_flagged_example()}
                            </span>
                        </span>
                    {/if}
                </li>
            {/each}
        </ol>

        <div class="flex flex-col items-center gap-2">
            <h2 class="text-muted-foreground text-xs font-medium">
                {m.empty_languages_title()}
            </h2>
            <ul class="flex flex-wrap justify-center gap-2">
                {#each LANGUAGE_CODES as code (code)}
                    <li>
                        <Badge variant="secondary"
                            >{languageLabel[code]()}</Badge
                        >
                    </li>
                {/each}
            </ul>
        </div>
    </Empty.Content>
</Empty.Root>
