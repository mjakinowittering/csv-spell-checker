<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import { LANGUAGE_CODES } from '$lib/languages/codes';

    import SupportedLanguages from './SupportedLanguages.svelte';

    const { Story } = defineMeta({
        title: 'Empty/SupportedLanguages',
        component: SupportedLanguages,
        tags: ['autodocs'],
        args: { languages: [...LANGUAGE_CODES] },
        argTypes: {
            languages: { control: 'check', options: [...LANGUAGE_CODES] }
        }
    });
</script>

<Story name="All supported" />

<Story name="English only" args={{ languages: ['en-GB', 'en-US'] }} />
