<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import { LANGUAGE_CODES, type ColumnLanguage } from '$lib/languages/codes';

    import LanguageSelect from './LanguageSelect.svelte';

    const options: ColumnLanguage[] = [...LANGUAGE_CODES, 'none'];

    const { Story } = defineMeta({
        title: 'Languages/LanguageSelect',
        component: LanguageSelect,
        tags: ['autodocs'],
        args: {
            value: 'fr',
            options,
            label: 'Language for column B',
            placeholder: 'Choose a language',
            detected: null,
            size: 'default',
            class: 'w-64',
            onchange: fn()
        },
        argTypes: {
            value: { control: 'select', options: [null, ...options] },
            size: { control: 'inline-radio', options: ['sm', 'default'] }
        }
    });
</script>

<Story name="Chosen" />

<Story name="Nothing chosen" args={{ value: null }} />

<Story
    name="Unsupported"
    args={{
        value: 'unsupported',
        options: [...options, 'unsupported'],
        detected: 'pl'
    }}
/>

<Story name="Small" args={{ size: 'sm', class: 'w-56' }} />
