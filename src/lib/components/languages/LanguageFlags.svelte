<script lang="ts">
    import * as Avatar from '$lib/components/ui/avatar';

    import type { LanguageCode } from '$lib/languages/codes';
    import { languageFlag } from '$lib/languages/flags';
    import { languageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';

    let {
        languages,
        showCode = true,
        max = 3,
        size = 'sm'
    }: {
        /** The distinct languages a sheet is checked in. */
        languages: readonly LanguageCode[];
        /** Show the code (or "Mixed") next to the flags. */
        showCode?: boolean;
        /** Flags shown before the rest collapse into a "+N" count. */
        max?: number;
        /** `xs` fits inside a tab. */
        size?: 'sm' | 'xs';
    } = $props();

    const names = $derived(
        languages.map((language) => languageLabel[language]()).join(', ')
    );
    const shown = $derived(languages.slice(0, max));
    const hidden = $derived(languages.length - shown.length);
</script>

{#if languages.length > 0}
    <span
        data-language-flags={languages.join(' ')}
        title={names}
        class="flex shrink-0 items-center gap-1.5"
    >
        {#if languages.length === 1}
            <span
                aria-hidden="true"
                class={[
                    size === 'xs' ? 'text-sm' : 'text-base',
                    'leading-none'
                ]}
            >
                {languageFlag[languages[0]]}
            </span>
        {:else}
            <!-- A mixed sheet stacks one flag per language. -->
            <Avatar.Group aria-hidden="true" class="-space-x-1.5">
                {#each shown as language (language)}
                    <Avatar.Root
                        size="sm"
                        class={size === 'xs' ? 'size-5' : undefined}
                    >
                        <Avatar.Fallback class="bg-background text-sm">
                            {languageFlag[language]}
                        </Avatar.Fallback>
                    </Avatar.Root>
                {/each}
                {#if hidden > 0}
                    <Avatar.GroupCount
                        class={[
                            'text-[0.625rem]',
                            size === 'xs' ? 'size-5' : 'size-6'
                        ]}
                    >
                        +{hidden}
                    </Avatar.GroupCount>
                {/if}
            </Avatar.Group>
        {/if}
        {#if showCode}
            <span
                aria-hidden="true"
                class="text-muted-foreground text-xs font-medium"
            >
                {languages.length === 1 ? languages[0] : m.languages_mixed()}
            </span>
        {/if}
        <span class="sr-only">
            {m.languages_flags_label({ languages: names })}
        </span>
    </span>
{/if}
