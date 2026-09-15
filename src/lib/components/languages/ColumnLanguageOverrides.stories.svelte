<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import { LANGUAGE_CODES, type ColumnLanguage } from '$lib/languages/codes';

    import ColumnLanguageOverrides from './ColumnLanguageOverrides.svelte';

    const options: ColumnLanguage[] = [...LANGUAGE_CODES, 'none'];

    const { Story } = defineMeta({
        title: 'Languages/ColumnLanguageOverrides',
        component: ColumnLanguageOverrides,
        tags: ['autodocs'],
        args: {
            headers: ['Name', 'Bio', 'Notes', ''],
            languages: ['none', 'en-GB', 'fr', 'en-GB'],
            options,
            detected: null
        }
    });
</script>

<Story name="Mixed" />

<Story name="Not chosen yet" args={{ languages: [null, null, null, null] }} />

<Story
    name="Unsupported"
    args={{
        languages: ['unsupported', 'unsupported', 'de', 'unsupported'],
        options: [...options, 'unsupported'],
        detected: 'hu'
    }}
/>
