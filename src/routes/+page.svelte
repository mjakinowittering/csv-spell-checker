<script lang="ts">
    import UploadIcon from '@lucide/svelte/icons/upload';
    import { toast } from 'svelte-sonner';

    import EmptyState from '$lib/components/empty/EmptyState.svelte';
    import SheetGrid from '$lib/components/grid/SheetGrid.svelte';
    import SheetLoading from '$lib/components/sheet/SheetLoading.svelte';
    import SheetTabs from '$lib/components/shell/SheetTabs.svelte';
    import StatusBar from '$lib/components/shell/StatusBar.svelte';
    import Toolbar from '$lib/components/shell/Toolbar.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';

    import { m } from '$lib/paraglide/messages';
    import { importFiles, importPastedText } from '$lib/workbook/importer';
    import { Workbook } from '$lib/workbook/workbook.svelte';

    const workbook = new Workbook();

    let fileInput = $state<HTMLInputElement | null>(null);
    // The Input component binds `value`; clearing it must go through the
    // binding; setting the DOM value directly is overwritten and throws.
    let fileInputValue = $state('');
    let dragDepth = $state(0);

    const active = $derived(workbook.active);

    function openFilePicker() {
        fileInput?.click();
    }

    function onFilesChosen(event: Event & { currentTarget: HTMLInputElement }) {
        importFiles(workbook, Array.from(event.currentTarget.files ?? []));
        // Reset so choosing the same file again still fires `change`.
        fileInputValue = '';
    }

    async function pasteFromClipboard() {
        let text: string;
        try {
            text = await navigator.clipboard.readText();
        } catch (error) {
            console.error('Clipboard read refused', error);
            toast.error(m.import_clipboard_error());
            return;
        }
        importPastedText(workbook, text);
    }

    function isEditable(target: EventTarget | null): boolean {
        return (
            target instanceof HTMLElement &&
            (target.isContentEditable ||
                target.closest('input, textarea, [contenteditable]') !== null)
        );
    }

    function onpaste(event: ClipboardEvent) {
        // Editable fields (the cell editor) keep their native paste.
        if (isEditable(event.target)) return;
        const text = event.clipboardData?.getData('text/plain') ?? '';
        if (text === '') return;
        event.preventDefault();
        importPastedText(workbook, text);
    }

    function carriesFiles(event: DragEvent): boolean {
        return event.dataTransfer?.types.includes('Files') ?? false;
    }

    function ondragenter(event: DragEvent) {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        dragDepth += 1;
    }

    function ondragleave(event: DragEvent) {
        if (!carriesFiles(event)) return;
        dragDepth = Math.max(0, dragDepth - 1);
    }

    function ondragover(event: DragEvent) {
        if (!carriesFiles(event) || !event.dataTransfer) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    function ondrop(event: DragEvent) {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        dragDepth = 0;
        importFiles(workbook, Array.from(event.dataTransfer?.files ?? []));
    }
</script>

<svelte:window {onpaste} {ondragenter} {ondragleave} {ondragover} {ondrop} />

<Input
    bind:ref={fileInput}
    bind:value={fileInputValue}
    type="file"
    multiple
    accept=".csv,text/csv"
    tabindex={-1}
    aria-label={m.import_file_label()}
    class="sr-only"
    onchange={onFilesChosen}
/>

<div class="bg-background flex h-dvh flex-col">
    <Toolbar
        issueCount={0}
        hasSheet={active?.phase.kind === 'ready'}
        canUndo={false}
        canRedo={false}
        onupload={openFilePicker}
    />

    <main class="min-h-0 flex-1 overflow-hidden">
        {#if active === null}
            <EmptyState>
                {#snippet actions()}
                    <div class="flex flex-col items-center gap-2">
                        <Button onclick={openFilePicker}>
                            <UploadIcon />
                            {m.import_upload_action()}
                        </Button>
                        <p class="text-muted-foreground text-xs">
                            {m.import_paste_hint()}
                        </p>
                    </div>
                {/snippet}
            </EmptyState>
        {:else if active.phase.kind === 'parsing'}
            <SheetLoading name={active.name} progress={active.phase.progress} />
        {:else}
            {#key active.id}
                <SheetGrid rows={active.rows} />
            {/key}
        {/if}
    </main>

    <SheetTabs
        sheets={workbook.sheets}
        activeId={workbook.activeId}
        onactivate={(id) => workbook.activate(id)}
        onclose={(id) => workbook.close(id)}
        onupload={openFilePicker}
        onpaste={pasteFromClipboard}
    />

    <StatusBar
        rowCount={active?.phase.kind === 'ready' ? active.rows.length : null}
    />
</div>

{#if dragDepth > 0}
    <div
        class="bg-background/80 pointer-events-none fixed inset-0 z-50 p-4 backdrop-blur-sm"
    >
        <div
            class="border-primary flex h-full items-center justify-center rounded-xl border-2 border-dashed"
        >
            <p class="text-sm font-medium">{m.import_drop_title()}</p>
        </div>
    </div>
{/if}
