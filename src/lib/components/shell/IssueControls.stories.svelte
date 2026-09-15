<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import IssueControls from './IssueControls.svelte';

    const { Story } = defineMeta({
        title: 'Shell/IssueControls',
        component: IssueControls,
        tags: ['autodocs'],
        args: {
            issueCount: 3,
            checking: false,
            onshowissues: fn(),
            onpreviousissue: fn(),
            onnextissue: fn()
        },
        argTypes: {
            issueCount: { control: { type: 'number', min: 0 } }
        }
    });
</script>

<Story name="Issues" />

<Story name="One issue" args={{ issueCount: 1 }} />

<Story name="No issues" args={{ issueCount: 0 }} />

<Story name="Checking" args={{ checking: true }} />
