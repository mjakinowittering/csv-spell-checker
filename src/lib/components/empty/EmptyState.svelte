<script lang="ts">
    import ClipboardPasteIcon from '@lucide/svelte/icons/clipboard-paste';
    import SpellCheckIcon from '@lucide/svelte/icons/spell-check';
    import UploadIcon from '@lucide/svelte/icons/upload';

    import { Button } from '$lib/components/ui/button';
    import * as Empty from '$lib/components/ui/empty';

    import { m } from '$lib/paraglide/messages';

    import ImportSteps from './ImportSteps.svelte';
    import SupportedLanguages from './SupportedLanguages.svelte';

    let {
        onupload,
        onpaste
    }: {
        onupload: () => void;
        onpaste: () => void;
    } = $props();
</script>

<Empty.Root class="h-full justify-start overflow-y-auto sm:justify-center">
    <Empty.Header class="max-w-lg">
        <Empty.Media variant="icon">
            <SpellCheckIcon />
        </Empty.Media>
        <Empty.Title>{m.empty_title()}</Empty.Title>
        <Empty.Description>{m.empty_description()}</Empty.Description>
    </Empty.Header>

    <Empty.Content class="max-w-xl gap-8">
        <div class="flex w-full flex-col items-center gap-4">
            <div class="flex flex-wrap items-center justify-center gap-3">
                <Button onclick={onupload}>
                    <UploadIcon />
                    {m.empty_upload_action()}
                </Button>
                <span class="text-muted-foreground text-xs uppercase">
                    {m.empty_or()}
                </span>
                <Button variant="outline" onclick={onpaste}>
                    <ClipboardPasteIcon />
                    {m.empty_paste_action()}
                </Button>
            </div>

            <!-- Files can be dropped anywhere on the page; this is the visible
                 target, and clicking it browses for a file. -->
            <Button
                variant="outline"
                class="text-muted-foreground h-28 w-full flex-col gap-1 border-2 border-dashed whitespace-normal"
                onclick={onupload}
            >
                <span class="text-foreground text-sm font-medium">
                    {m.empty_drop_title()}
                </span>
                <span class="text-xs">{m.empty_drop_hint()}</span>
            </Button>
        </div>

        <ImportSteps />

        <SupportedLanguages />
    </Empty.Content>
</Empty.Root>
