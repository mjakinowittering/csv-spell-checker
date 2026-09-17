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
            value: 'Trés résistant et trés doux, idéal pour les chiens qui aiment macher pendant des heures.',
            language: 'fr',
            languages: ['fr'],
            issues: [
                {
                    key: 'trés',
                    word: 'Trés',
                    suggestion: 'Très',
                    replacements: { Trés: 'Très', trés: 'très' }
                },
                {
                    key: 'macher',
                    word: 'macher',
                    suggestion: 'mâcher',
                    replacements: { macher: 'mâcher' }
                }
            ],
            open: true,
            onconfirm: fn(),
            onignoreword: fn(),
            ondismissword: fn(),
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
        issues: [
            { key: 'xyzzq', word: 'xyzzq', suggestion: null, replacements: {} }
        ]
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

<Story
    name="Words from two languages"
    args={{
        value: 'Sehr chłonna und szczelna Windel für die Nacht.',
        language: 'de',
        languages: ['de', 'pl'],
        issues: [
            {
                key: 'chłonna',
                word: 'chłonna',
                suggestion: 'chanson',
                replacements: { chłonna: 'chanson' }
            }
        ]
    }}
/>
