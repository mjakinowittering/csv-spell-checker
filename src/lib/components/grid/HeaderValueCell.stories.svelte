<script module lang="ts">
    import GridCellPreview from '../../../stories/GridCellPreview.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';

    // The CSV header row (spreadsheet row 1): bold, and spell-checked.
    const { Story } = defineMeta({
        title: 'Grid/HeaderValueCell',
        component: GridCellPreview,
        tags: ['autodocs'],
        args: { cell: 'header', column: 1 },
        argTypes: {
            cell: { control: false },
            row: { control: false },
            column: { control: { type: 'number', min: 0, max: 2 } }
        }
    });
</script>

<Story name="Header" />
