<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import StatusLegend from './StatusLegend.svelte';

    const { Story } = defineMeta({
        title: 'Shell/StatusLegend',
        component: StatusLegend,
        tags: ['autodocs']
    });
</script>

<Story name="Legend">
    {#snippet template()}
        <div class="text-muted-foreground flex items-center gap-4 text-xs">
            <StatusLegend />
        </div>
    {/snippet}
</Story>
