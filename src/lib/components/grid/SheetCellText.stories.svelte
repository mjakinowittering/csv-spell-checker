<script module lang="ts">
    import SheetCellTextPreview from '../../../stories/SheetCellTextPreview.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';

    // SheetCellText reads its sheet from the grid context, so the preview
    // builds a one-cell sheet from these controls.
    const { Story } = defineMeta({
        title: 'Grid/SheetCellText',
        component: SheetCellTextPreview,
        tags: ['autodocs'],
        args: {
            value: 'Loves hikking',
            header: false,
            edited: false,
            flagged: true,
            current: false
        }
    });
</script>

<Story name="Flagged" />

<Story name="Clean" args={{ value: 'Loves hiking' }} />

<Story name="Edited and clean" args={{ value: 'Loves hiking', edited: true }} />

<Story name="Edited but still flagged" args={{ edited: true }} />

<Story name="Current issue" args={{ current: true }} />

<Story name="Header" args={{ value: 'Bio', header: true }} />
