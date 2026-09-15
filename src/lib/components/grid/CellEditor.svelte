<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Label } from '$lib/components/ui/label';
    import { Switch } from '$lib/components/ui/switch';
    import { Textarea } from '$lib/components/ui/textarea';

    import { grammarlyAttributes } from '$lib/editor/grammarly';
    import { grammarlyPreference } from '$lib/editor/grammarly-preference.svelte';
    import { cellReference } from '$lib/grid/coordinates';
    import { isLanguageCode, type ColumnLanguage } from '$lib/languages/codes';
    import { m } from '$lib/paraglide/messages';

    import CellIssueChips from './CellIssueChips.svelte';

    let {
        row,
        column,
        value,
        language,
        issues = [],
        onconfirm,
        onignoreword,
        onclosed,
        open = $bindable(true)
    }: {
        row: number;
        column: number;
        value: string;
        language: ColumnLanguage;
        /** The cell's flagged words, as last checked. */
        issues?: readonly string[];
        onconfirm: (value: string) => void;
        /** Ignore a flagged word across the whole sheet. */
        onignoreword?: (word: string) => void;
        onclosed: () => void;
        /**
         * Opens with the editor. It always closes through this state, so
         * bits-ui can tear down its dismiss layer: unmounting it while open
         * leaves that layer behind and the next editor ignores overlay clicks.
         */
        open?: boolean;
    } = $props();

    // The parent mounts a fresh editor per edit, so the draft always starts
    // from the cell's current value.
    function initialDraft(): string {
        return value;
    }
    let draft = $state(initialDraft());

    const grammarlyId = $props.id();

    function confirm() {
        onconfirm(draft);
        open = false;
    }

    function onkeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            confirm();
        }
    }
</script>

<!-- Only Confirm saves. Overlay click, Escape, the X and Cancel just close. -->
<Dialog.Root
    bind:open
    onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onclosed();
    }}
>
    <Dialog.Content class="sm:max-w-lg">
        <Dialog.Header>
            <Dialog.Title>
                {m.editor_title({ cell: cellReference(row, column) })}
            </Dialog.Title>
        </Dialog.Header>

        <!-- Native spellcheck (and extensions like Grammarly) run in here,
             in the column's language. -->
        <Textarea
            bind:value={draft}
            lang={isLanguageCode(language) ? language : undefined}
            spellcheck={true}
            rows={6}
            aria-label={m.editor_value_label()}
            class="max-h-[50vh] min-h-32"
            {onkeydown}
            {...grammarlyAttributes(grammarlyPreference.allowed)}
        />

        {#if onignoreword}
            <CellIssueChips words={issues} onignore={onignoreword} />
        {/if}

        <Dialog.Footer class="sm:items-center">
            <!-- Grammarly is blocked unless allowed; remembered per device. -->
            <div class="flex items-center gap-2 sm:mr-auto">
                <Switch
                    id={grammarlyId}
                    bind:checked={grammarlyPreference.allowed}
                />
                <Label for={grammarlyId}>{m.editor_grammarly_label()}</Label>
            </div>
            <Button variant="outline" onclick={() => (open = false)}>
                {m.editor_cancel_action()}
            </Button>
            <Button onclick={confirm}>
                {m.editor_confirm_action()}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
