<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import EmptyState from './EmptyState.svelte';

    const { Story } = defineMeta({
        title: 'Empty/EmptyState',
        component: EmptyState,
        tags: ['autodocs'],
        parameters: { layout: 'fullscreen' },
        args: {
            onupload: fn(),
            onpaste: fn()
        }
    });
</script>

<Story name="First run" />
