<script lang="ts">
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import DownloadIcon from '@lucide/svelte/icons/download';
    import Redo2Icon from '@lucide/svelte/icons/redo-2';
    import SpellCheckIcon from '@lucide/svelte/icons/spell-check';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
    import Undo2Icon from '@lucide/svelte/icons/undo-2';
    import UploadIcon from '@lucide/svelte/icons/upload';

    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import * as ButtonGroup from '$lib/components/ui/button-group';
    import { Separator } from '$lib/components/ui/separator';
    import { Spinner } from '$lib/components/ui/spinner';

    import { m } from '$lib/paraglide/messages';

    import ThemeToggle from './ThemeToggle.svelte';
    import ToolbarButton from './ToolbarButton.svelte';

    let {
        issueCount,
        sheetOpen,
        checking = false,
        hasSheet,
        canUndo,
        canRedo,
        onundo,
        onredo,
        onpreviousissue,
        onnextissue,
        onshowissues,
        ondownload,
        onupload
    }: {
        issueCount: number;
        /** Any tab is open. Sheet controls are hidden until then. */
        sheetOpen: boolean;
        checking?: boolean;
        /** The active sheet is ready: its grid is showing. */
        hasSheet: boolean;
        canUndo: boolean;
        canRedo: boolean;
        onundo?: () => void;
        onredo?: () => void;
        onpreviousissue?: () => void;
        onnextissue?: () => void;
        /** Open the sheet-wide list of flagged words. */
        onshowissues?: () => void;
        ondownload?: () => void;
        onupload?: () => void;
    } = $props();
</script>

<header
    aria-label={m.toolbar_label()}
    class="bg-background flex h-12 shrink-0 items-center gap-1 border-b px-2 sm:gap-2 sm:px-3"
>
    <div class="flex items-center gap-2">
        <div
            class="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md"
        >
            <SpellCheckIcon class="size-4" />
        </div>
        <span class={['text-sm font-semibold', sheetOpen && 'max-sm:sr-only']}>
            {m.app_title()}
        </span>
    </div>

    {#if sheetOpen}
        <Separator
            orientation="vertical"
            class="mx-1 data-vertical:h-5 data-vertical:self-center max-sm:hidden"
        />

        <ButtonGroup.Root>
            <ToolbarButton
                icon={Undo2Icon}
                label={m.toolbar_undo_hint()}
                disabled={!canUndo || !onundo}
                onclick={onundo}
            />
            <ToolbarButton
                icon={Redo2Icon}
                label={m.toolbar_redo_hint()}
                disabled={!canRedo || !onredo}
                onclick={onredo}
            />
        </ButtonGroup.Root>
    {/if}

    <!-- Issues only mean something once the grid is showing. -->
    {#if hasSheet}
        <Separator
            orientation="vertical"
            class="mx-1 data-vertical:h-5 data-vertical:self-center max-sm:hidden"
        />

        <div class="flex items-center gap-1">
            {#snippet issuesBadge()}
                <Badge
                    variant={!checking && issueCount > 0
                        ? 'destructive'
                        : 'secondary'}
                    aria-live="polite"
                >
                    {#if checking}
                        <Spinner stroke="currentColor" class="size-3" />
                        {m.toolbar_checking()}
                    {:else}
                        {#if issueCount > 0}
                            <TriangleAlertIcon aria-hidden="true" />
                        {/if}
                        {issueCount === 1
                            ? m.toolbar_issues_one()
                            : m.toolbar_issues_count({ count: issueCount })}
                    {/if}
                </Badge>
            {/snippet}

            <!-- With issues to show, the badge opens the flagged words. -->
            {#if onshowissues && !checking && issueCount > 0}
                <Button
                    variant="ghost"
                    size="sm"
                    aria-haspopup="dialog"
                    title={m.toolbar_issues_open_hint()}
                    class="h-auto rounded-full p-0"
                    onclick={onshowissues}
                >
                    {@render issuesBadge()}
                    <span class="sr-only">{m.toolbar_issues_open_hint()}</span>
                </Button>
            {:else}
                {@render issuesBadge()}
            {/if}
            <ToolbarButton
                icon={ChevronLeftIcon}
                label={m.toolbar_issue_previous_hint()}
                disabled={issueCount === 0 || !onpreviousissue}
                onclick={onpreviousissue}
            />
            <ToolbarButton
                icon={ChevronRightIcon}
                label={m.toolbar_issue_next_hint()}
                disabled={issueCount === 0 || !onnextissue}
                onclick={onnextissue}
            />
        </div>
    {/if}

    <div class="ml-auto flex items-center gap-1">
        {#if hasSheet}
            <ToolbarButton
                icon={DownloadIcon}
                label={m.toolbar_download_hint()}
                disabled={!ondownload}
                onclick={ondownload}
            />
        {/if}
        <ToolbarButton
            icon={UploadIcon}
            label={m.toolbar_upload_hint()}
            disabled={!onupload}
            onclick={onupload}
        />
        <Separator
            orientation="vertical"
            class="mx-1 data-vertical:h-5 data-vertical:self-center max-sm:hidden"
        />
        <ThemeToggle />
    </div>
</header>
