<script lang="ts">
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
    import DownloadIcon from '@lucide/svelte/icons/download';
    import Redo2Icon from '@lucide/svelte/icons/redo-2';
    import SpellCheckIcon from '@lucide/svelte/icons/spell-check';
    import Undo2Icon from '@lucide/svelte/icons/undo-2';
    import UploadIcon from '@lucide/svelte/icons/upload';

    import { Badge } from '$lib/components/ui/badge';
    import * as ButtonGroup from '$lib/components/ui/button-group';
    import { Separator } from '$lib/components/ui/separator';

    import { m } from '$lib/paraglide/messages';

    import ThemeToggle from './ThemeToggle.svelte';
    import ToolbarButton from './ToolbarButton.svelte';

    let {
        issueCount,
        hasSheet,
        canUndo,
        canRedo,
        onundo,
        onredo,
        onpreviousissue,
        onnextissue,
        ondownload,
        onupload
    }: {
        issueCount: number;
        hasSheet: boolean;
        canUndo: boolean;
        canRedo: boolean;
        onundo?: () => void;
        onredo?: () => void;
        onpreviousissue?: () => void;
        onnextissue?: () => void;
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
        <span class="text-sm font-semibold max-sm:sr-only">
            {m.app_title()}
        </span>
    </div>

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

    <Separator
        orientation="vertical"
        class="mx-1 data-vertical:h-5 data-vertical:self-center max-sm:hidden"
    />

    <div class="flex items-center gap-1">
        <Badge
            variant={issueCount > 0 ? 'destructive' : 'secondary'}
            aria-live="polite"
        >
            {m.toolbar_issues_count({ count: issueCount })}
        </Badge>
        <ToolbarButton
            icon={ChevronUpIcon}
            label={m.toolbar_issue_previous_hint()}
            disabled={issueCount === 0 || !onpreviousissue}
            onclick={onpreviousissue}
        />
        <ToolbarButton
            icon={ChevronDownIcon}
            label={m.toolbar_issue_next_hint()}
            disabled={issueCount === 0 || !onnextissue}
            onclick={onnextissue}
        />
    </div>

    <div class="ml-auto flex items-center gap-1">
        <ToolbarButton
            icon={DownloadIcon}
            label={m.toolbar_download_hint()}
            disabled={!hasSheet || !ondownload}
            onclick={ondownload}
        />
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
