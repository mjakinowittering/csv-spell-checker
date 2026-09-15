<script module lang="ts">
    import { storySheet } from '../../../stories/fixtures.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import SheetTab from './SheetTab.svelte';

    const { Story } = defineMeta({
        title: 'Shell/SheetTab',
        component: SheetTab,
        tags: ['autodocs'],
        args: {
            active: true,
            renaming: false,
            onactivate: fn(),
            onclose: fn(),
            onrename: fn()
        },
        argTypes: {
            sheet: { control: false }
        }
    });
</script>

<!-- In the app each tab is an item in SheetTabs' list. -->
{#snippet tabList(children: import('svelte').Snippet)}
    <ul class="flex">
        <li>{@render children()}</li>
    </ul>
{/snippet}

<Story name="Active">
    {#snippet template(args)}
        {#snippet tab()}
            <SheetTab {...args} sheet={storySheet({ name: 'People' })} />
        {/snippet}
        {@render tabList(tab)}
    {/snippet}
</Story>

<Story name="Inactive" args={{ active: false }}>
    {#snippet template(args)}
        {#snippet tab()}
            <SheetTab {...args} sheet={storySheet({ name: 'People' })} />
        {/snippet}
        {@render tabList(tab)}
    {/snippet}
</Story>

<Story name="Mixed languages">
    {#snippet template(args)}
        {#snippet tab()}
            <SheetTab
                {...args}
                sheet={storySheet({
                    name: 'Catalogue',
                    languages: ['fr', 'en-GB', 'de']
                })}
            />
        {/snippet}
        {@render tabList(tab)}
    {/snippet}
</Story>

<Story name="Loading">
    {#snippet template(args)}
        {#snippet tab()}
            <SheetTab {...args} sheet={storySheet({ phase: 'parsing' })} />
        {/snippet}
        {@render tabList(tab)}
    {/snippet}
</Story>

<Story name="Renaming" args={{ renaming: true }}>
    {#snippet template(args)}
        {#snippet tab()}
            <SheetTab {...args} sheet={storySheet({ name: 'People' })} />
        {/snippet}
        {@render tabList(tab)}
    {/snippet}
</Story>
