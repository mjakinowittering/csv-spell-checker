<script lang="ts">
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card';
    import * as Select from '$lib/components/ui/select';

    import { columnLetter } from '$lib/grid/coordinates';
    import {
        isColumnLanguage,
        LANGUAGE_CODES,
        type ColumnLanguage
    } from '$lib/languages/codes';
    import type { LanguageGuess } from '$lib/languages/detect';
    import { languageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';

    let {
        headers,
        guess,
        onconfirm,
        oncancel
    }: {
        headers: readonly string[];
        guess: LanguageGuess;
        onconfirm: (languages: ColumnLanguage[]) => void;
        oncancel: () => void;
    } = $props();

    const options: readonly ColumnLanguage[] = [...LANGUAGE_CODES, 'none'];

    // Every column starts on the sheet-wide guess. The parent keys this
    // component by sheet, so each new sheet starts from its own guess and
    // nothing carries over from an earlier confirmation.
    function initialLanguages(): ColumnLanguage[] {
        return headers.map(() => guess.language);
    }
    let languages = $state(initialLanguages());

    function setLanguage(index: number, value: string) {
        if (isColumnLanguage(value)) languages[index] = value;
    }
</script>

<div class="flex h-full justify-center overflow-y-auto p-4 sm:p-8">
    <Card.Root class="h-fit w-full max-w-2xl">
        <Card.Header>
            <Card.Title>{m.languages_confirm_title()}</Card.Title>
        </Card.Header>

        <Card.Content>
            <ul class="divide-y">
                {#each headers as header, index (index)}
                    {@const letter = columnLetter(index)}
                    {@const uncertain =
                        !guess.confident && languages[index] === guess.language}
                    <li
                        data-column-row
                        class="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5"
                    >
                        <div class="flex min-w-0 flex-1 items-baseline gap-3">
                            <span
                                class="text-muted-foreground w-20 shrink-0 text-sm"
                            >
                                {m.languages_column_label({ letter })}
                            </span>
                            {#if header.trim() !== ''}
                                <span class="truncate text-sm font-medium">
                                    {m.languages_column_header({
                                        name: header
                                    })}
                                </span>
                            {/if}
                        </div>

                        <div class="flex items-center gap-2">
                            <Select.Root
                                type="single"
                                value={languages[index]}
                                onValueChange={(value) =>
                                    setLanguage(index, value)}
                            >
                                <Select.Trigger
                                    size="sm"
                                    class="w-44"
                                    aria-label={m.languages_select_label({
                                        letter
                                    })}
                                >
                                    {languageLabel[languages[index]]()}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each options as option (option)}
                                        <Select.Item
                                            value={option}
                                            label={languageLabel[option]()}
                                        />
                                    {/each}
                                </Select.Content>
                            </Select.Root>

                            <!-- Fixed width keeps dropdowns aligned whether or not a row is marked. -->
                            <div class="w-16">
                                {#if uncertain}
                                    <Badge
                                        data-low-confidence
                                        variant="outline"
                                        class="border-amber-500/50 text-amber-700 dark:text-amber-400"
                                    >
                                        <TriangleAlertIcon aria-hidden="true" />
                                        {m.languages_low_confidence_badge()}
                                    </Badge>
                                {/if}
                            </div>
                        </div>
                    </li>
                {/each}
            </ul>

            {#if !guess.confident}
                <p
                    class="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs"
                >
                    <TriangleAlertIcon
                        aria-hidden="true"
                        class="size-3.5 text-amber-600 dark:text-amber-400"
                    />
                    {m.languages_low_confidence_legend()}
                </p>
            {/if}
        </Card.Content>

        <Card.Footer class="justify-end gap-2">
            <Button variant="outline" onclick={oncancel}>
                {m.languages_cancel_action()}
            </Button>
            <Button onclick={() => onconfirm([...languages])}>
                {m.languages_continue_action()}
            </Button>
        </Card.Footer>
    </Card.Root>
</div>
