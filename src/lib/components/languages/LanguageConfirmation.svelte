<script lang="ts">
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import * as Collapsible from '$lib/components/ui/collapsible';

    import { LANGUAGE_CODES, type ColumnLanguage } from '$lib/languages/codes';
    import type { LanguageGuess } from '$lib/languages/detect';
    import { languageName } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';

    import ColumnLanguageOverrides from './ColumnLanguageOverrides.svelte';
    import LanguageSelect from './LanguageSelect.svelte';

    let {
        headers,
        guess,
        overridesOpen = $bindable(false),
        onconfirm,
        oncancel
    }: {
        headers: readonly string[];
        guess: LanguageGuess;
        /** Whether the per-column overrides are expanded. */
        overridesOpen?: boolean;
        onconfirm: (
            languages: ColumnLanguage[],
            sheetLanguage: ColumnLanguage | null
        ) => void;
        oncancel: () => void;
    } = $props();

    // The parent keys this component by sheet, so every new sheet starts
    // from its own guess and nothing carries over from an earlier sheet.
    // Below the confidence threshold the guess is null: nothing is chosen.
    function initialGuess(): ColumnLanguage | null {
        return guess.prefill;
    }
    function initialLanguages(): (ColumnLanguage | null)[] {
        return headers.map(() => guess.prefill);
    }
    let sheetLanguage = $state(initialGuess());
    let languages = $state(initialLanguages());

    const options = $derived<ColumnLanguage[]>([
        ...LANGUAGE_CODES,
        'none',
        // Only offered when the detected language is one we cannot check.
        ...(guess.prefill === 'unsupported' ? (['unsupported'] as const) : [])
    ]);

    const complete = $derived(
        languages.every(
            (language): language is ColumnLanguage => language !== null
        )
    );

    /** The sheet-wide picker sets every column at once. */
    function setSheetLanguage(language: ColumnLanguage) {
        languages = headers.map(() => language);
    }

    function confirm() {
        const chosen = languages.filter(
            (language): language is ColumnLanguage => language !== null
        );
        if (chosen.length !== headers.length) return;
        const uniform = chosen.every((language) => language === chosen[0]);
        onconfirm(chosen, uniform ? chosen[0] : null);
    }
</script>

<div class="flex h-full justify-center overflow-y-auto p-4 sm:p-8">
    <Collapsible.Root bind:open={overridesOpen} class="h-fit w-full max-w-2xl">
        <Card.Root>
            <Card.Header>
                <Card.Title>{m.languages_confirm_title()}</Card.Title>
            </Card.Header>

            <Card.Content class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span class="shrink-0 text-sm font-medium">
                        {m.languages_sheet_label()}
                    </span>
                    <LanguageSelect
                        bind:value={sheetLanguage}
                        {options}
                        detected={guess.detected}
                        class="min-w-48 flex-1"
                        label={m.languages_sheet_label()}
                        placeholder={m.languages_sheet_placeholder()}
                        onchange={setSheetLanguage}
                    />
                </div>

                {#if guess.prefill === null}
                    <p
                        data-low-confidence
                        class="flex items-center gap-1.5 text-sm text-amber-800 dark:text-amber-300"
                    >
                        <TriangleAlertIcon aria-hidden="true" class="size-4" />
                        {m.languages_low_confidence_notice()}
                    </p>
                {:else if guess.prefill === 'unsupported' && guess.detected}
                    <p
                        data-unsupported
                        class="flex items-center gap-1.5 text-sm text-amber-800 dark:text-amber-300"
                    >
                        <TriangleAlertIcon aria-hidden="true" class="size-4" />
                        {m.languages_unsupported_notice({
                            language: languageName(guess.detected)
                        })}
                    </p>
                {/if}

                <!-- Expanded, the columns sit between the sheet-wide picker
                     and the actions, with the collapse control at their top. -->
                <Collapsible.Content class="flex flex-col gap-2">
                    <Collapsible.Trigger>
                        {#snippet child({ props })}
                            <Button
                                {...props}
                                variant="ghost"
                                class="-ml-2 w-fit"
                            >
                                <ChevronDownIcon />
                                {m.languages_overrides_hide()}
                            </Button>
                        {/snippet}
                    </Collapsible.Trigger>
                    <ColumnLanguageOverrides
                        {headers}
                        bind:languages
                        {options}
                        detected={guess.detected}
                    />
                </Collapsible.Content>
            </Card.Content>

            <Card.Footer class="flex-wrap gap-2">
                {#if !overridesOpen}
                    <Collapsible.Trigger>
                        {#snippet child({ props })}
                            <Button {...props} variant="ghost" class="-ml-2">
                                <ChevronRightIcon />
                                {headers.length === 1
                                    ? m.languages_overrides_toggle_one()
                                    : m.languages_overrides_toggle({
                                          count: headers.length
                                      })}
                            </Button>
                        {/snippet}
                    </Collapsible.Trigger>
                {/if}
                <div class="ml-auto flex gap-2">
                    <Button variant="outline" onclick={oncancel}>
                        {m.languages_cancel_action()}
                    </Button>
                    <Button disabled={!complete} onclick={confirm}>
                        {m.languages_continue_action()}
                    </Button>
                </div>
            </Card.Footer>
        </Card.Root>
    </Collapsible.Root>
</div>
