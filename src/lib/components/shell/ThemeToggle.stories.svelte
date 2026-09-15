<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import ThemeToggle from './ThemeToggle.svelte';

    // Storybook's own theme switcher sets the preview theme; this is the
    // app's control, which reads and writes mode-watcher's preference.
    const { Story } = defineMeta({
        title: 'Shell/ThemeToggle',
        component: ThemeToggle,
        tags: ['autodocs']
    });
</script>

<Story name="Toggle" />
