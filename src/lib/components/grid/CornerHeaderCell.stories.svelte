<script module lang="ts">
    import GridCellPreview from '../../../stories/GridCellPreview.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';

    // Visually blank; its label is for screen readers only.
    const { Story } = defineMeta({
        title: 'Grid/CornerHeaderCell',
        component: GridCellPreview,
        tags: ['autodocs'],
        args: { cell: 'corner' },
        argTypes: {
            cell: { control: false },
            row: { control: false },
            column: { control: false }
        }
    });
</script>

<Story name="Corner" />
