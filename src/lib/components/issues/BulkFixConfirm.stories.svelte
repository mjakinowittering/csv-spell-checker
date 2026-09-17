<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import * as Dialog from '$lib/components/ui/dialog';

    import type { FixTarget } from '$lib/workbook/sheet.svelte';

    import BulkFixConfirm from './BulkFixConfirm.svelte';

    const german = (row: number, text: string): FixTarget => ({
        row,
        column: 1,
        text,
        languages: ['de'],
        mixed: false
    });
    const polish = (row: number, text: string): FixTarget => ({
        row,
        column: 1,
        text,
        languages: ['de', 'pl'],
        mixed: true
    });

    const { Story } = defineMeta({
        title: 'Issues/BulkFixConfirm',
        component: BulkFixConfirm,
        tags: ['autodocs'],
        args: {
            word: 'chłonna',
            suggestion: 'chanson',
            single: [
                german(6, 'Sehr chłonna Windel für die Nacht'),
                german(9, 'Extra chłonna Auflage'),
                german(14, 'Besonders chłonna Einlage')
            ],
            mixed: [
                polish(7, 'Bardzo chłonna wkładka na noc'),
                polish(11, 'Wyjątkowo chłonna pielucha'),
                polish(12, 'Cienka i chłonna wkładka'),
                polish(18, 'Delikatna i chłonna warstwa'),
                polish(21, 'Mocno chłonna pielucha'),
                polish(24, 'Chłonna wkładka dla dzieci'),
                polish(30, 'Bardzo chłonna warstwa'),
                polish(33, 'Chłonna i szczelna wkładka')
            ],
            onconfirm: fn(),
            oncancel: fn()
        },
        argTypes: {
            single: { control: false },
            mixed: { control: false }
        }
    });
</script>

<!-- It renders inside the flagged-words dialog, so it needs that context. -->
{#snippet inDialog(children: import('svelte').Snippet)}
    <Dialog.Root open>
        <Dialog.Content class="sm:max-w-xl">
            {@render children()}
        </Dialog.Content>
    </Dialog.Root>
{/snippet}

<Story name="Mixed cells found">
    {#snippet template(args)}
        {#snippet confirm()}
            <BulkFixConfirm {...args} />
        {/snippet}
        {@render inDialog(confirm)}
    {/snippet}
</Story>

<Story
    name="One mixed cell"
    args={{ mixed: [polish(7, 'Bardzo chłonna wkładka')] }}
>
    {#snippet template(args)}
        {#snippet confirm()}
            <BulkFixConfirm {...args} />
        {/snippet}
        {@render inDialog(confirm)}
    {/snippet}
</Story>

<Story name="Every cell is mixed" args={{ single: [] }}>
    {#snippet template(args)}
        {#snippet confirm()}
            <BulkFixConfirm {...args} />
        {/snippet}
        {@render inDialog(confirm)}
    {/snippet}
</Story>
