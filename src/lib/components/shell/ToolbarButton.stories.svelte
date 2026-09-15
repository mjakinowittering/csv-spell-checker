<script module lang="ts">
    import Undo2Icon from '@lucide/svelte/icons/undo-2';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import ToolbarButton from './ToolbarButton.svelte';

    const { Story } = defineMeta({
        title: 'Shell/ToolbarButton',
        component: ToolbarButton,
        tags: ['autodocs'],
        args: {
            icon: Undo2Icon,
            label: 'Undo',
            disabled: false,
            onclick: fn()
        },
        argTypes: {
            icon: { control: false }
        }
    });
</script>

<Story name="Enabled" />

<Story name="Disabled" args={{ disabled: true }} />
