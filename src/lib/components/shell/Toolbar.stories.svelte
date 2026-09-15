<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import Toolbar from './Toolbar.svelte';

    const { Story } = defineMeta({
        title: 'Shell/Toolbar',
        component: Toolbar,
        tags: ['autodocs'],
        parameters: { layout: 'fullscreen' },
        args: {
            issueCount: 4,
            sheetOpen: true,
            checking: false,
            hasSheet: true,
            languages: ['en-GB'],
            canUndo: true,
            canRedo: false,
            onundo: fn(),
            onredo: fn(),
            onpreviousissue: fn(),
            onnextissue: fn(),
            onshowissues: fn(),
            ondownload: fn(),
            onupload: fn()
        },
        argTypes: {
            languages: {
                control: 'check',
                options: ['en-GB', 'en-US', 'fr', 'de', 'es']
            }
        }
    });
</script>

<Story
    name="No sheet"
    args={{
        sheetOpen: false,
        hasSheet: false,
        issueCount: 0,
        canUndo: false,
        languages: []
    }}
/>

<Story name="Ready" />

<Story name="Checking" args={{ checking: true }} />

<Story name="No issues" args={{ issueCount: 0 }} />

<Story
    name="Mixed languages"
    args={{ languages: ['fr', 'en-GB', 'de', 'es'] }}
/>

<Story name="Confirming languages" args={{ hasSheet: false }} />
