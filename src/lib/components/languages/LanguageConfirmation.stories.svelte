<script module lang="ts">
    import {
        confidentGuess,
        lowConfidenceGuess,
        unsupportedGuess
    } from '../../../stories/fixtures.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { fn } from 'storybook/test';

    import LanguageConfirmation from './LanguageConfirmation.svelte';

    const { Story } = defineMeta({
        title: 'Languages/LanguageConfirmation',
        component: LanguageConfirmation,
        tags: ['autodocs'],
        parameters: { layout: 'fullscreen' },
        args: {
            headers: ['Name', 'Bio', 'Notes'],
            guess: confidentGuess,
            overridesOpen: false,
            onconfirm: fn(),
            oncancel: fn()
        }
    });
</script>

<Story name="Confident" />

<Story name="Low confidence" args={{ guess: lowConfidenceGuess }} />

<Story name="Unsupported language" args={{ guess: unsupportedGuess }} />

<Story name="Columns expanded" args={{ overridesOpen: true }} />

<Story
    name="Low confidence, columns expanded"
    args={{ guess: lowConfidenceGuess, overridesOpen: true }}
/>
