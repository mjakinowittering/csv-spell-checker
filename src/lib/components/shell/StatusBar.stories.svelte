<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import StatusBar from './StatusBar.svelte';

    const { Story } = defineMeta({
        title: 'Shell/StatusBar',
        component: StatusBar,
        tags: ['autodocs'],
        parameters: { layout: 'fullscreen' },
        args: {
            rowCount: 128,
            pending: false,
            selection: { cell: 'C2', language: 'es' },
            legend: true
        }
    });
</script>

<Story name="Cell selected" />

<Story name="Nothing selected" args={{ selection: null }} />

<Story
    name="Column not checked"
    args={{ selection: { cell: 'A5', language: 'none' } }}
/>

<Story
    name="Reading a file"
    args={{ rowCount: null, pending: true, selection: null, legend: false }}
/>

<Story name="Confirming languages" args={{ selection: null, legend: false }} />
