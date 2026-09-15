<script module lang="ts">
    import { storySheet } from '../../../stories/fixtures.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import SheetTabs from './SheetTabs.svelte';

    const sheets = [
        storySheet({ name: 'People' }),
        storySheet({ name: 'Catalogue', languages: ['fr', 'en-GB', 'de'] }),
        storySheet({ name: 'Sheet 3', phase: 'parsing' })
    ];

    const { Story } = defineMeta({
        title: 'Shell/SheetTabs',
        component: SheetTabs,
        tags: ['autodocs'],
        parameters: { layout: 'fullscreen' },
        args: {
            sheets,
            activeId: sheets[0].id,
            onactivate: fn(),
            onclose: fn(),
            onrename: fn(),
            onupload: fn(),
            onpaste: fn()
        },
        argTypes: {
            sheets: { control: false },
            activeId: {
                control: 'select',
                options: sheets.map((sheet) => sheet.id)
            }
        }
    });
</script>

<Story name="Several sheets" />

<Story name="Second sheet active" args={{ activeId: sheets[1].id }} />

<Story name="No sheets" args={{ sheets: [], activeId: null }} />
