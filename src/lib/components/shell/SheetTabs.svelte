<script lang="ts">
    import ClipboardPasteIcon from '@lucide/svelte/icons/clipboard-paste';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import UploadIcon from '@lucide/svelte/icons/upload';
    import XIcon from '@lucide/svelte/icons/x';

    import LanguageFlags from '$lib/components/languages/LanguageFlags.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { Spinner } from '$lib/components/ui/spinner';

    import { m } from '$lib/paraglide/messages';
    import type { Sheet } from '$lib/workbook/sheet.svelte';

    let {
        sheets,
        activeId,
        onactivate,
        onclose,
        onupload,
        onpaste
    }: {
        sheets: readonly Sheet[];
        activeId: string | null;
        onactivate: (id: string) => void;
        onclose: (id: string) => void;
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
            {@const active = sheet.id === activeId}
            <div
                class={[
                    'flex shrink-0 items-center rounded-md border',
                    active
                        ? 'border-border bg-background shadow-xs'
                        : 'border-transparent'
                ]}
            >
                <Button
                    role="tab"
                    aria-selected={active}
                    variant="ghost"
                    size="sm"
                    class="max-w-48 hover:bg-transparent"
                    onclick={() => onactivate(sheet.id)}
                >
                    {#if sheet.phase.kind === 'parsing'}
                        <Spinner
                            stroke="currentColor"
                            class="size-3.5"
                            aria-label={m.tabs_parsing_label()}
                        />
                    {/if}
                    <LanguageFlags
                        languages={sheet.checkedLanguages}
                        showCode={false}
                        size="xs"
                        max={2}
                    />
                    <span class="truncate">{sheet.name}</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    class="mr-1"
                    aria-label={m.tabs_close_label({ name: sheet.name })}
                    onclick={() => onclose(sheet.id)}
                >
                    <XIcon />
                </Button>
            </div>
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
