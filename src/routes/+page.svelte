<script lang="ts">
    import UploadIcon from '@lucide/svelte/icons/upload';
    import { base } from '$app/paths';
    import { toast } from 'svelte-sonner';

    import EmptyState from '$lib/components/empty/EmptyState.svelte';
    import CellEditor from '$lib/components/grid/CellEditor.svelte';
    import SheetGrid from '$lib/components/grid/SheetGrid.svelte';
    import LanguageConfirmation from '$lib/components/languages/LanguageConfirmation.svelte';
    import SheetLoading from '$lib/components/sheet/SheetLoading.svelte';
    import SheetTabs from '$lib/components/shell/SheetTabs.svelte';
    import StatusBar from '$lib/components/shell/StatusBar.svelte';
    import Toolbar from '$lib/components/shell/Toolbar.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';

    import { csvFileName, downloadCsv } from '$lib/csv/download';
    import { serializeCsv } from '$lib/csv/serialize';
    import { languageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';
    import {
        adjacentIssue,
        type IssueDirection
    } from '$lib/spellcheck/navigation';
    import { Spellchecker } from '$lib/spellcheck/spellchecker';
    import { importFiles, importPastedText } from '$lib/workbook/importer';
    import type { Sheet } from '$lib/workbook/sheet.svelte';
    import { Workbook } from '$lib/workbook/workbook.svelte';

    type EditTarget = { sheet: Sheet; row: number; column: number };

    const workbook = new Workbook();

    /** Download a sheet's current values, edits included, as CSV. */
    function exportSheet(sheet: Sheet) {
        downloadCsv(
            csvFileName(sheet.sourceFileName ?? sheet.name),
            serializeCsv(sheet.snapshot())
        );
    }

    // Resolved lazily: the page is prerendered, where `location` is undefined.
    const spellchecker = new Spellchecker(
        () => new URL(`${base}/dictionaries/`, location.href).href,
        (language) =>
            toast.error(
                m.spellcheck_dictionary_error({
                    language: languageLabel[language]()
                })
            )
    );

    let fileInput = $state<HTMLInputElement | null>(null);
    // The Input component binds `value`; clearing it must go through the
    // binding; setting the DOM value directly is overwritten and throws.
    let fileInputValue = $state('');
    let dragDepth = $state(0);
    let editing = $state<EditTarget | null>(null);

    const active = $derived(workbook.active);
    const ready = $derived(active?.phase.kind === 'ready' ? active : null);

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

    function confirmLanguages(sheet: Sheet, languages: Sheet['languages']) {
        sheet.confirmLanguages(languages);
        spellchecker.checkSheet(sheet);
    }

    function closeSheet(id: string) {
        workbook.close(id);
        spellchecker.release(id);
    }

    // The editor closes itself and reports back through `onclosed`.
    function confirmEdit(value: string) {
        if (!editing) return;
        const { sheet, row, column } = editing;
        // Only the edited cell is re-checked, never the whole sheet.
        if (sheet.editCell(row, column, value)) {
            spellchecker.checkCell(sheet, row, column);
        }
    }

    function undo() {
        const sheet = ready;
        const edit = sheet?.undo();
        if (sheet && edit) spellchecker.checkCell(sheet, edit.row, edit.column);
    }

    function redo() {
        const sheet = ready;
        const edit = sheet?.redo();
        if (sheet && edit) spellchecker.checkCell(sheet, edit.row, edit.column);
    }

    // The grid scrolls to and focuses whichever issue becomes current.
    function goToIssue(direction: IssueDirection) {
        const sheet = ready;
        if (!sheet) return;
        const target = adjacentIssue(
            sheet.flaggedCells(),
            sheet.currentIssue,
            direction
        );
        if (target) sheet.currentIssue = target;
    }

    function isEditable(target: EventTarget | null): boolean {
        return (
            target instanceof HTMLElement &&
            (target.isContentEditable ||
                target.closest('input, textarea, [contenteditable]') !== null)
        );
    }

    function onkeydown(event: KeyboardEvent) {
        // Text fields keep their own undo; the dialog owns the keyboard.
        if (editing || !ready || isEditable(event.target)) return;
        if (!(event.ctrlKey || event.metaKey)) return;
        const key = event.key.toLowerCase();
        if (key === 'z') {
            event.preventDefault();
            if (event.shiftKey) redo();
            else undo();
        } else if (key === 'y') {
            event.preventDefault();
            redo();
        }
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

<svelte:window
    {onkeydown}
    {onpaste}
    {ondragenter}
    {ondragleave}
    {ondragover}
    {ondrop}
/>

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
        issueCount={ready?.issueCount ?? 0}
        checking={ready?.checkState === 'checking'}
        hasSheet={ready !== null}
        canUndo={ready?.history.canUndo ?? false}
        canRedo={ready?.history.canRedo ?? false}
        onundo={undo}
        onredo={redo}
        onpreviousissue={() => goToIssue('previous')}
        onnextissue={() => goToIssue('next')}
        ondownload={() => {
            if (ready) exportSheet(ready);
        }}
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
        {:else if active.phase.kind === 'confirming'}
            {@const sheet = active}
            {#key sheet.id}
                <LanguageConfirmation
                    headers={sheet.rows[0]}
                    guess={active.phase.guess}
                    onconfirm={(languages) =>
                        confirmLanguages(sheet, languages)}
                    oncancel={() => closeSheet(sheet.id)}
                />
            {/key}
        {:else}
            {@const sheet = active}
            {#key sheet.id}
                <SheetGrid
                    {sheet}
                    oneditcell={(row, column) =>
                        (editing = { sheet, row, column })}
                />
            {/key}
        {/if}
    </main>

    <SheetTabs
        sheets={workbook.sheets}
        activeId={workbook.activeId}
        onactivate={(id) => workbook.activate(id)}
        onclose={closeSheet}
        onupload={openFilePicker}
        onpaste={pasteFromClipboard}
    />

    <StatusBar
        rowCount={active && active.phase.kind !== 'parsing'
            ? active.rows.length
            : null}
        legend={ready !== null}
    />
</div>

{#if editing}
    {@const target = editing}
    {#key target}
        <CellEditor
            row={target.row}
            column={target.column}
            value={target.sheet.cellValue(target.row, target.column)}
            language={target.sheet.languages[target.column] ?? 'none'}
            onconfirm={confirmEdit}
            onclosed={() => {
                // A newer edit may already have replaced this one.
                if (editing === target) editing = null;
            }}
        />
    {/key}
{/if}

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
