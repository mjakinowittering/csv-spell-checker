<script lang="ts">
    import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
    import ClipboardPasteIcon from '@lucide/svelte/icons/clipboard-paste';
    import Grid3x3Icon from '@lucide/svelte/icons/grid-3x3';
    import SpellCheckIcon from '@lucide/svelte/icons/spell-check';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
    import UploadIcon from '@lucide/svelte/icons/upload';

    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import * as Empty from '$lib/components/ui/empty';

    import { LANGUAGE_CODES } from '$lib/languages/codes';
    import { languageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';

    let {
        onupload,
        onpaste
    }: {
        onupload: () => void;
        onpaste: () => void;
    } = $props();

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

<Empty.Root class="h-full justify-start overflow-y-auto sm:justify-center">
    <Empty.Header class="max-w-lg">
        <Empty.Media variant="icon">
            <SpellCheckIcon />
        </Empty.Media>
        <Empty.Title>{m.empty_title()}</Empty.Title>
        <Empty.Description>{m.empty_description()}</Empty.Description>
    </Empty.Header>

    <Empty.Content class="max-w-xl gap-8">
        <div class="flex w-full flex-col items-center gap-4">
            <div class="flex flex-wrap items-center justify-center gap-3">
                <Button onclick={onupload}>
                    <UploadIcon />
                    {m.empty_upload_action()}
                </Button>
                <span class="text-muted-foreground text-xs uppercase">
                    {m.empty_or()}
                </span>
                <Button variant="outline" onclick={onpaste}>
                    <ClipboardPasteIcon />
                    {m.empty_paste_action()}
                </Button>
            </div>

            <!-- Files can be dropped anywhere on the page; this is the visible
                 target, and clicking it browses for a file. -->
            <Button
                variant="outline"
                class="text-muted-foreground h-28 w-full flex-col gap-1 border-2 border-dashed whitespace-normal"
                onclick={onupload}
            >
                <span class="text-foreground text-sm font-medium">
                    {m.empty_drop_title()}
                </span>
                <span class="text-xs">{m.empty_drop_hint()}</span>
            </Button>
        </div>

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

        <div class="flex flex-col items-center gap-2">
            <h2 class="text-muted-foreground text-xs font-medium">
                {m.empty_languages_title()}
            </h2>
            <ul class="flex flex-wrap justify-center gap-2">
                {#each LANGUAGE_CODES as code (code)}
                    <li>
                        <Badge variant="secondary">
                            {languageLabel[code]()}
                        </Badge>
                    </li>
                {/each}
            </ul>
        </div>
    </Empty.Content>
</Empty.Root>
