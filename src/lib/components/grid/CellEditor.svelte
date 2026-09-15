<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Textarea } from '$lib/components/ui/textarea';

    import { cellReference } from '$lib/grid/coordinates';
    import type { ColumnLanguage } from '$lib/languages/codes';
    import { m } from '$lib/paraglide/messages';

    let {
        row,
        column,
        value,
        language,
        onconfirm,
        onclosed
    }: {
        row: number;
        column: number;
        value: string;
        language: ColumnLanguage;
        onconfirm: (value: string) => void;
        onclosed: () => void;
    } = $props();

    // The parent mounts a fresh editor per edit, so the draft always starts
    // from the cell's current value.
    function initialDraft(): string {
        return value;
    }
    let draft = $state(initialDraft());

    // The dialog always closes through its own `open` state, so bits-ui can
    // tear down its dismiss layer. Unmounting it while open leaves that layer
    // behind and the next editor ignores overlay clicks.
    let open = $state(true);

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
            lang={language === 'none' ? undefined : language}
            spellcheck={true}
            rows={6}
            aria-label={m.editor_value_label()}
            class="max-h-[50vh] min-h-32"
            {onkeydown}
        />

        <Dialog.Footer>
            <Button variant="outline" onclick={() => (open = false)}>
                {m.editor_cancel_action()}
            </Button>
            <Button onclick={confirm}>
                {m.editor_confirm_action()}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
