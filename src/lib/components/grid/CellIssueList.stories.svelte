<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import CellIssueList from './CellIssueList.svelte';

    const { Story } = defineMeta({
        title: 'Grid/CellIssueList',
        component: CellIssueList,
        tags: ['autodocs'],
        args: {
            issues: [
                { key: 'trés', word: 'Trés', suggestion: 'Très' },
                { key: 'macher', word: 'macher', suggestion: 'mâcher' }
            ],
            onfix: fn(),
            onignore: fn()
        }
    });
</script>

<Story name="Several issues" />

<Story
    name="One issue"
    args={{ issues: [{ key: 'facil', word: 'facil', suggestion: 'facile' }] }}
/>

<Story
    name="No suggestion"
    args={{
        issues: [{ key: 'xyzzq', word: 'xyzzq', suggestion: null }]
    }}
/>

<!-- Renders nothing: the heading only appears with issues to show. -->
<Story name="No issues" args={{ issues: [] }} />
