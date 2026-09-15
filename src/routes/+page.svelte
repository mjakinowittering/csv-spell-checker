<script lang="ts">
    import { base } from '$app/paths';
    import { onMount } from 'svelte';
    import { toast } from 'svelte-sonner';

    import EmptyState from '$lib/components/empty/EmptyState.svelte';
    import CellEditor from '$lib/components/grid/CellEditor.svelte';
    import SheetGrid from '$lib/components/grid/SheetGrid.svelte';
    import LanguageConfirmation from '$lib/components/languages/LanguageConfirmation.svelte';
    import SheetLoading from '$lib/components/sheet/SheetLoading.svelte';
    import SheetTabs from '$lib/components/shell/SheetTabs.svelte';
    import StatusBar from '$lib/components/shell/StatusBar.svelte';
    import Toolbar from '$lib/components/shell/Toolbar.svelte';
    import { Input } from '$lib/components/ui/input';

    import { csvFileName, downloadCsv } from '$lib/csv/download';
    import { serializeCsv } from '$lib/csv/serialize';
    import { languageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';
    import { Persistence } from '$lib/persistence/persistence';
    import { WorkbookStore } from '$lib/persistence/store';
    import {
        adjacentIssue,
        type IssueDirection
    } from '$lib/spellcheck/navigation';
    import { Spellchecker } from '$lib/spellcheck/spellchecker';
    import { importFiles, importPastedText } from '$lib/workbook/importer';
    import { Sheet } from '$lib/workbook/sheet.svelte';
    import { Workbook } from '$lib/workbook/workbook.svelte';

    type EditTarget = { sheet: Sheet; row: number; column: number };

    const workbook = new Workbook();

    // Every mutation below writes straight through to IndexedDB.
    const persistence = new Persistence(new WorkbookStore(), () =>
        toast.error(m.persistence_save_error())
    );

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
    // Until stored sheets are back, the empty state would only flash.
    let restored = $state(false);

    const active = $derived(workbook.active);

    // The active sheet once its grid is showing. A plain function, not
    // $derived: as a derived it went stale when a second sheet became ready
    // while the toolbar blocks reading it were torn down and recreated, and
    // the toolbar and status bar stayed in the not-ready state until the tab
    // was switched. Reading the phase on every call avoids that.
    function readySheet(): Sheet | null {
        const sheet = workbook.active;
        return sheet?.phase.kind === 'ready' ? sheet : null;
    }

    onMount(() => {
        void restore();
    });

    /**
     * Bring back every sheet from IndexedDB as it was left. Spelling flags are
     * never stored: ready sheets are checked again from their current cells.
     */
    async function restore() {
        try {
            const stored = await persistence.store.load();
            const sheets = stored.sheets.map(({ record, rows }) =>
                Sheet.fromRecord(record, rows)
            );
            workbook.restore(sheets, stored.activeId, stored.uploadCount);
            for (const sheet of sheets) {
                if (sheet.phase.kind === 'ready')
                    spellchecker.checkSheet(sheet);
            }
        } catch (error) {
            console.error('Could not load saved sheets', error);
            toast.error(m.persistence_load_error());
        } finally {
            restored = true;
        }
    }

    function onparsed(sheet: Sheet) {
        persistence.sheetAdded(sheet, workbook);
    }

    function openFilePicker() {
        fileInput?.click();
    }

    function onFilesChosen(event: Event & { currentTarget: HTMLInputElement }) {
        importFiles(
            workbook,
            Array.from(event.currentTarget.files ?? []),
            onparsed
        );
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
        importPastedText(workbook, text, onparsed);
    }

    function confirmLanguages(sheet: Sheet, languages: Sheet['languages']) {
        sheet.confirmLanguages(languages);
        persistence.sheetChanged(sheet);
        spellchecker.checkSheet(sheet);
    }

    function activateSheet(id: string) {
        workbook.activate(id);
        persistence.workbookChanged(workbook);
    }

    function closeSheet(id: string) {
        workbook.close(id);
        spellchecker.release(id);
        persistence.sheetRemoved(id, workbook);
    }

    // The editor closes itself and reports back through `onclosed`.
    function confirmEdit(value: string) {
        if (!editing) return;
        const { sheet, row, column } = editing;
        if (sheet.editCell(row, column, value)) {
            persistence.sheetChanged(sheet);
            // Only the edited cell is re-checked, never the whole sheet.
            spellchecker.checkCell(sheet, row, column);
        }
    }

    function undo() {
        const sheet = readySheet();
        const edit = sheet?.undo();
        if (!sheet || !edit) return;
        persistence.sheetChanged(sheet);
        spellchecker.checkCell(sheet, edit.row, edit.column);
    }

    function redo() {
        const sheet = readySheet();
        const edit = sheet?.redo();
        if (!sheet || !edit) return;
        persistence.sheetChanged(sheet);
        spellchecker.checkCell(sheet, edit.row, edit.column);
    }

    // The grid scrolls to and focuses whichever issue becomes current.
    function goToIssue(direction: IssueDirection) {
        const sheet = readySheet();
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
        if (editing || !readySheet() || isEditable(event.target)) return;
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
        importPastedText(workbook, text, onparsed);
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
        importFiles(
            workbook,
            Array.from(event.dataTransfer?.files ?? []),
            onparsed
        );
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
        issueCount={readySheet()?.issueCount ?? 0}
        sheetOpen={active !== null}
        checking={readySheet()?.checkState === 'checking'}
        hasSheet={readySheet() !== null}
        canUndo={readySheet()?.history.canUndo ?? false}
        canRedo={readySheet()?.history.canRedo ?? false}
        onundo={undo}
        onredo={redo}
        onpreviousissue={() => goToIssue('previous')}
        onnextissue={() => goToIssue('next')}
        ondownload={() => {
            const sheet = readySheet();
            if (sheet) exportSheet(sheet);
        }}
        onupload={openFilePicker}
    />

    <main class="min-h-0 flex-1 overflow-hidden">
        {#if active === null}
            {#if restored}
                <EmptyState
                    onupload={openFilePicker}
                    onpaste={pasteFromClipboard}
                />
            {/if}
        {:else if active.phase.kind === 'parsing'}
            <SheetLoading progress={active.phase.progress} />
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
        onactivate={activateSheet}
        onclose={closeSheet}
        onupload={openFilePicker}
        onpaste={pasteFromClipboard}
    />

    <StatusBar
        rowCount={active && active.phase.kind !== 'parsing'
            ? active.rows.length
            : null}
        pending={active?.phase.kind === 'parsing'}
        legend={readySheet() !== null}
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
