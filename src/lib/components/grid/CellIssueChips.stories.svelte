<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import CellIssueChips from './CellIssueChips.svelte';

    const { Story } = defineMeta({
        title: 'Grid/CellIssueChips',
        component: CellIssueChips,
        tags: ['autodocs'],
        args: {
            words: ['Recieve', 'teh', 'adress'],
            onignore: fn()
        }
    });
</script>

<Story name="Several words" />

<Story name="One word" args={{ words: ['hikking'] }} />

<!-- Renders nothing: the heading only appears with words to show. -->
<Story name="No words" args={{ words: [] }} />
