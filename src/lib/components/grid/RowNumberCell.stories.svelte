<script module lang="ts">
    import GridCellPreview from '../../../stories/GridCellPreview.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';

    // Sheet row 1 is spreadsheet row 2: the CSV header is row 1.
    const { Story } = defineMeta({
        title: 'Grid/RowNumberCell',
        component: GridCellPreview,
        tags: ['autodocs'],
        args: { cell: 'row-number', row: 1 },
        argTypes: {
            cell: { control: false },
            column: { control: false },
            row: { control: { type: 'number', min: 1 } }
        }
    });
</script>

<Story name="Row number" />
