<script module lang="ts">
    import { storySheet } from '../../../stories/fixtures.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import SheetGrid from './SheetGrid.svelte';

    const { Story } = defineMeta({
        title: 'Grid/SheetGrid',
        component: SheetGrid,
        tags: ['autodocs'],
        parameters: {
            layout: 'fullscreen',
            a11y: {
                // Two violations come from SVAR's own markup, which the app
                // cannot change: its column-resize grips carry an aria-label
                // on role="presentation", and its first row is given
                // aria-rowindex="0". Everything else is still checked.
                config: {
                    rules: [
                        { id: 'aria-prohibited-attr', enabled: false },
                        { id: 'aria-valid-attr-value', enabled: false }
                    ]
                }
            }
        },
        args: {
            oneditcell: fn()
        },
        argTypes: {
            sheet: { control: false }
        }
    });
</script>

<Story name="Flags and edits">
    {#snippet template(args)}
        <div class="h-80">
            <SheetGrid
                {...args}
                sheet={storySheet({
                    edits: [
                        [2, 1, 'Enjoys long walks by the sea'],
                        [4, 2, 'Sits in teh oak chair']
                    ]
                })}
            />
        </div>
    {/snippet}
</Story>

<Story name="Clean">
    {#snippet template(args)}
        <div class="h-80">
            <SheetGrid {...args} sheet={storySheet({ flagged: false })} />
        </div>
    {/snippet}
</Story>
