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
                { key: 'trés', word: 'Trés', count: 47, suggestion: 'Très' },
                {
                    key: 'nettoye',
                    word: 'nettoye',
                    count: 31,
                    suggestion: 'nettoie'
                },
                { key: 'facil', word: 'facil', count: 2, suggestion: 'facile' },
                {
                    key: 'vittesse',
                    word: 'vittesse',
                    count: 3,
                    suggestion: 'vitesse'
                },
                { key: 'xyzzq', word: 'xyzzq', count: 1, suggestion: null }
            ],
            onfix: fn(),
            onignore: fn()
        }
    });
</script>

<Story name="Flagged words" />

<Story name="Nothing flagged" args={{ words: [] }} />
