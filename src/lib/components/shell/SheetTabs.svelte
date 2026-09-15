<script lang="ts">
    import ClipboardPasteIcon from '@lucide/svelte/icons/clipboard-paste';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import UploadIcon from '@lucide/svelte/icons/upload';

    import { Button } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

    import { m } from '$lib/paraglide/messages';
    import type { Sheet } from '$lib/workbook/sheet.svelte';

    import SheetTab from './SheetTab.svelte';

    let {
        sheets,
        activeId,
        onactivate,
        onclose,
        onrename,
        onupload,
        onpaste
    }: {
        sheets: readonly Sheet[];
        activeId: string | null;
        onactivate: (id: string) => void;
        onclose: (id: string) => void;
        onrename: (id: string, name: string) => void;
        onupload?: () => void;
        onpaste?: () => void;
    } = $props();
</script>

<nav
    aria-label={m.tabs_label()}
    class="bg-muted/50 flex h-10 shrink-0 items-center gap-1 border-t px-1.5"
>
    <div
        role="tablist"
        aria-label={m.tabs_label()}
        class="flex min-w-0 items-center gap-1 overflow-x-auto py-1"
    >
        {#each sheets as sheet (sheet.id)}
            <SheetTab
                {sheet}
                active={sheet.id === activeId}
                onactivate={() => onactivate(sheet.id)}
                onclose={() => onclose(sheet.id)}
                onrename={(name) => onrename(sheet.id, name)}
            />
        {/each}
    </div>

    <DropdownMenu.Root>
        <DropdownMenu.Trigger aria-label={m.tabs_add_label()}>
            {#snippet child({ props })}
                <Button
                    {...props}
                    variant="ghost"
                    size="icon-sm"
                    class="shrink-0"
                >
                    <PlusIcon />
                </Button>
            {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" side="top" class="w-auto">
            <DropdownMenu.Item disabled={!onupload} onSelect={onupload}>
                <UploadIcon />
                {m.tabs_add_upload()}
            </DropdownMenu.Item>
            <DropdownMenu.Item disabled={!onpaste} onSelect={onpaste}>
                <ClipboardPasteIcon />
                {m.tabs_add_paste()}
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</nav>
