<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import CellEditor from './CellEditor.svelte';

    const { Story } = defineMeta({
        title: 'Grid/CellEditor',
        component: CellEditor,
        tags: ['autodocs'],
        args: {
            row: 1,
            column: 1,
            value: 'Loves hikking and coffee',
            language: 'en-GB',
            issues: ['hikking'],
            open: true,
            onconfirm: fn(),
            onignoreword: fn(),
            onclosed: fn()
        },
        argTypes: {
            language: {
                control: 'select',
                options: [
                    'en-GB',
                    'en-US',
                    'fr',
                    'de',
                    'es',
                    'none',
                    'unsupported'
                ]
            }
        }
    });
</script>

<Story name="With issues" />

<Story
    name="Several issues"
    args={{
        value: 'Recieve parcels at teh side door',
        issues: ['Recieve', 'teh']
    }}
/>

<Story name="Clean" args={{ value: 'Loves hiking and coffee', issues: [] }} />

<Story name="Column not checked" args={{ language: 'none', issues: [] }} />
