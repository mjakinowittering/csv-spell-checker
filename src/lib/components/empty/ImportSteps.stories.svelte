<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import ImportSteps from './ImportSteps.svelte';

    const { Story } = defineMeta({
        title: 'Empty/ImportSteps',
        component: ImportSteps,
        tags: ['autodocs']
    });
</script>

<Story name="Steps" />
