<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import SheetLoading from './SheetLoading.svelte';

    const { Story } = defineMeta({
        title: 'Sheet/SheetLoading',
        component: SheetLoading,
        tags: ['autodocs'],
        parameters: { layout: 'fullscreen' },
        args: { progress: 0.35 },
        argTypes: {
            progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } }
        }
    });
</script>

<Story name="Reading" />

<Story name="Starting" args={{ progress: 0 }} />

<Story name="Almost done" args={{ progress: 0.97 }} />
