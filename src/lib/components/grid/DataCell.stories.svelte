<script module lang="ts">
    import GridCellPreview from '../../../stories/GridCellPreview.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';

    // DataCell adapts SVAR's cell props to SheetCellText for a body row.
    const { Story } = defineMeta({
        title: 'Grid/DataCell',
        component: GridCellPreview,
        tags: ['autodocs'],
        args: { cell: 'data', row: 1, column: 1 },
        argTypes: {
            cell: { control: false },
            row: { control: { type: 'number', min: 1, max: 4 } },
            column: { control: { type: 'number', min: 0, max: 2 } }
        }
    });
</script>

<Story name="Flagged" />

<Story name="Edited" args={{ row: 2 }} />

<Story name="Clean" args={{ row: 3 }} />
