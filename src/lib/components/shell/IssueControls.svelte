<script lang="ts">
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import { Spinner } from '$lib/components/ui/spinner';

    import { m } from '$lib/paraglide/messages';

    import ToolbarButton from './ToolbarButton.svelte';

    let {
        issueCount,
        checking = false,
        onshowissues,
        onpreviousissue,
        onnextissue
    }: {
        issueCount: number;
        checking?: boolean;
        /** Open the sheet-wide list of flagged words. */
        onshowissues?: () => void;
        onpreviousissue?: () => void;
        onnextissue?: () => void;
    } = $props();
</script>

<div class="flex items-center gap-1">
    {#snippet issuesBadge()}
        <!-- The destructive badge's own red text is under 4.5:1 on its tint
             in light mode; a darker red keeps the count readable. -->
        <Badge
            variant={!checking && issueCount > 0 ? 'destructive' : 'secondary'}
            aria-live="polite"
            class={!checking && issueCount > 0
                ? 'text-red-700 dark:text-red-300'
                : undefined}
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
