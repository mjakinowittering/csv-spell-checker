<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import WordSuggestion from './WordSuggestion.svelte';

    const { Story } = defineMeta({
        title: 'Issues/WordSuggestion',
        component: WordSuggestion,
        tags: ['autodocs'],
        args: { word: 'Trés', suggestion: 'très' }
    });
</script>

<Story name="With suggestion" />

<Story name="No suggestion" args={{ word: 'nettoyee', suggestion: null }} />
