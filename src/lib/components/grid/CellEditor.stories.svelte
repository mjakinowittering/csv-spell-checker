<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import { LANGUAGE_CODES } from '$lib/languages/codes';

    import CellEditor from './CellEditor.svelte';

    const { Story } = defineMeta({
        title: 'Grid/CellEditor',
        component: CellEditor,
        tags: ['autodocs'],
        args: {
            row: 3,
            column: 3,
            value: 'Trés résistant, idéal pour les chiens qui aiment macher pendant des heures.',
            language: 'fr',
            issues: [
                { key: 'trés', word: 'Trés', suggestion: 'Très' },
                { key: 'macher', word: 'macher', suggestion: 'mâcher' }
            ],
            open: true,
            onconfirm: fn(),
            onignoreword: fn(),
            onclosed: fn()
        },
        argTypes: {
            language: {
                control: 'select',
                options: [...LANGUAGE_CODES, 'none', 'unsupported']
            }
        }
    });
</script>

<Story name="With suggestions" />

<Story
    name="No suggestion for a word"
    args={{
        value: 'Livraison rapide, xyzzq garanti.',
        issues: [{ key: 'xyzzq', word: 'xyzzq', suggestion: null }]
    }}
/>

<Story
    name="Clean"
    args={{
        value: 'Très résistant, idéal pour les chiens.',
        issues: []
    }}
/>

<Story name="Column not checked" args={{ language: 'none', issues: [] }} />
