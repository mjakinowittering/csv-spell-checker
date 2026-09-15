<script lang="ts">
    import PencilIcon from '@lucide/svelte/icons/pencil';
    import XIcon from '@lucide/svelte/icons/x';
    import type { Attachment } from 'svelte/attachments';

    import LanguageFlags from '$lib/components/languages/LanguageFlags.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as ContextMenu from '$lib/components/ui/context-menu';
    import { Input } from '$lib/components/ui/input';
    import { Spinner } from '$lib/components/ui/spinner';

    import { m } from '$lib/paraglide/messages';
    import type { Sheet } from '$lib/workbook/sheet.svelte';

    let {
        sheet,
        active = false,
        renaming = $bindable(false),
        onactivate,
        onclose,
        onrename
    }: {
        sheet: Sheet;
        active?: boolean;
        /** Whether the tab shows its inline rename field. */
        renaming?: boolean;
        onactivate: () => void;
        onclose: () => void;
        /** Called with the trimmed new name, only when it changed. */
        onrename: (name: string) => void;
    } = $props();

    let draft = $state('');

    function startRename() {
        draft = sheet.name;
        renaming = true;
    }

    function finishRename(save: boolean) {
        if (!renaming) return;
        renaming = false;
        const name = draft.trim();
        if (save && name !== '' && name !== sheet.name) onrename(name);
    }

    function onTabKeydown(event: KeyboardEvent) {
        if (event.key === 'F2') {
            event.preventDefault();
            startRename();
        }
    }

    function onInputKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            finishRename(true);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            finishRename(false);
        }
    }

    // A frame later, so focus returning from the closed context menu does
    // not immediately blur (and so commit) the field.
    const focusAndSelect: Attachment<HTMLInputElement> = (input) => {
        const frame = requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
        return () => cancelAnimationFrame(frame);
    };
</script>

<ContextMenu.Root>
    <ContextMenu.Trigger>
        {#snippet child({ props })}
            <div
                {...props}
                data-sheet-tab={sheet.id}
                class={[
                    'flex shrink-0 items-center rounded-md border',
                    active
                        ? 'border-border bg-background shadow-xs'
                        : 'border-transparent'
                ]}
            >
                {#if renaming}
                    <Input
                        {@attach focusAndSelect}
                        bind:value={draft}
                        aria-label={m.tabs_rename_label({ name: sheet.name })}
                        maxlength={80}
                        class="ml-1 h-7 w-40 px-2 text-sm"
                        onkeydown={onInputKeydown}
                        onblur={() => finishRename(true)}
                    />
                {:else}
                    <Button
                        role="tab"
                        aria-selected={active}
                        variant="ghost"
                        size="sm"
                        class="max-w-48 hover:bg-transparent"
                        onclick={onactivate}
                        onkeydown={onTabKeydown}
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
                {/if}
                <Button
                    variant="ghost"
                    size="icon-xs"
                    class="mr-1"
                    aria-label={m.tabs_close_label({ name: sheet.name })}
                    onclick={onclose}
                >
                    <XIcon />
                </Button>
            </div>
        {/snippet}
    </ContextMenu.Trigger>
    <ContextMenu.Content
        class="w-40"
        onCloseAutoFocus={(event) => {
            // The rename field takes focus instead of the tab.
            if (renaming) event.preventDefault();
        }}
    >
        <ContextMenu.Item onSelect={startRename}>
            <PencilIcon />
            {m.tabs_rename_action()}
        </ContextMenu.Item>
        <ContextMenu.Item onSelect={onclose}>
            <XIcon />
            {m.tabs_close_action()}
        </ContextMenu.Item>
    </ContextMenu.Content>
</ContextMenu.Root>
