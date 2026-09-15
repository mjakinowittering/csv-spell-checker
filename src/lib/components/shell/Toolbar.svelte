<script lang="ts">
    import DownloadIcon from '@lucide/svelte/icons/download';
    import Redo2Icon from '@lucide/svelte/icons/redo-2';
    import SpellCheckIcon from '@lucide/svelte/icons/spell-check';
    import Undo2Icon from '@lucide/svelte/icons/undo-2';
    import UploadIcon from '@lucide/svelte/icons/upload';

    import LanguageFlags from '$lib/components/languages/LanguageFlags.svelte';
    import * as ButtonGroup from '$lib/components/ui/button-group';
    import { Separator } from '$lib/components/ui/separator';

    import type { LanguageCode } from '$lib/languages/codes';
    import { m } from '$lib/paraglide/messages';

    import IssueControls from './IssueControls.svelte';
    import ThemeToggle from './ThemeToggle.svelte';
    import ToolbarButton from './ToolbarButton.svelte';

    let {
        issueCount,
        sheetOpen,
        checking = false,
        hasSheet,
        languages = [],
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
        /** The active sheet's checked languages; several means mixed. */
        languages?: readonly LanguageCode[];
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
        <IssueControls
            {issueCount}
            {checking}
            {onshowissues}
            {onpreviousissue}
            {onnextissue}
        />
    {/if}

    {#if hasSheet && languages.length > 0}
        <Separator
            orientation="vertical"
            class="mx-1 data-vertical:h-5 data-vertical:self-center max-sm:hidden"
        />
        <LanguageFlags {languages} />
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
