<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';

    import { LANGUAGE_CODES } from '$lib/languages/codes';

    import LanguageFlags from './LanguageFlags.svelte';

    const { Story } = defineMeta({
        title: 'Languages/LanguageFlags',
        component: LanguageFlags,
        tags: ['autodocs'],
        args: {
            languages: ['en-GB'],
            showCode: true,
            max: 3,
            size: 'sm'
        },
        argTypes: {
            languages: { control: 'check', options: [...LANGUAGE_CODES] },
            size: { control: 'inline-radio', options: ['sm', 'xs'] }
        }
    });
</script>

<Story name="One language" />

<Story name="Mixed" args={{ languages: ['fr', 'en-GB'] }} />

<Story
    name="More than max"
    args={{ languages: ['fr', 'en-GB', 'de', 'es', 'en-US'] }}
/>

<Story
    name="In a tab"
    args={{
        languages: ['fr', 'en-GB', 'de'],
        showCode: false,
        size: 'xs',
        max: 2
    }}
/>
