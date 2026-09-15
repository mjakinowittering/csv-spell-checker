<script lang="ts">
    import * as Select from '$lib/components/ui/select';

    import {
        isColumnLanguage,
        type ColumnLanguage
    } from '$lib/languages/codes';
    import { columnLanguageLabel } from '$lib/languages/labels';

    let {
        value = $bindable(null),
        options,
        label,
        placeholder,
        detected = null,
        size = 'default',
        onchange,
        class: className
    }: {
        /** The chosen language, or null while nothing is chosen. */
        value?: ColumnLanguage | null;
        options: readonly ColumnLanguage[];
        /** Accessible name for the trigger. */
        label: string;
        /** Shown while `value` is null. */
        placeholder: string;
        /** The detected language, to name `unsupported`. */
        detected?: string | null;
        size?: 'sm' | 'default';
        /** Called after the user picks a language. */
        onchange?: (value: ColumnLanguage) => void;
        class?: string;
    } = $props();

    function select(next: string) {
        if (!isColumnLanguage(next)) return;
        value = next;
        onchange?.(next);
    }
</script>

<Select.Root type="single" value={value ?? ''} onValueChange={select}>
    <Select.Trigger
        {size}
        aria-label={label}
        data-placeholder={value === null ? '' : undefined}
        class={className}
    >
        <span class="truncate">
            {value === null
                ? placeholder
                : columnLanguageLabel(value, detected)}
        </span>
    </Select.Trigger>
    <Select.Content>
        {#each options as option (option)}
            <Select.Item
                value={option}
                label={columnLanguageLabel(option, detected)}
            />
        {/each}
    </Select.Content>
</Select.Root>
