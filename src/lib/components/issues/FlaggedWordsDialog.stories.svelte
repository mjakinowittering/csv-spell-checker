<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import FlaggedWordsDialog from './FlaggedWordsDialog.svelte';

    const { Story } = defineMeta({
        title: 'Issues/FlaggedWordsDialog',
        component: FlaggedWordsDialog,
        tags: ['autodocs'],
        args: {
            open: true,
            words: [
                {
                    key: 'hikking',
                    word: 'hikking',
                    count: 4,
                    suggestion: 'hiking'
                },
                {
                    key: 'recieve',
                    word: 'Recieve',
                    count: 2,
                    suggestion: 'Receive'
                },
                { key: 'adress', word: 'adress', count: 1, suggestion: null }
            ],
            onignore: fn()
        }
    });
</script>

<Story name="Flagged words" />

<Story name="Nothing flagged" args={{ words: [] }} />
