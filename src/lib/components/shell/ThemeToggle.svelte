<script lang="ts">
    import MonitorIcon from '@lucide/svelte/icons/monitor';
    import MoonIcon from '@lucide/svelte/icons/moon';
    import SunIcon from '@lucide/svelte/icons/sun';
    import { setMode, userPrefersMode } from 'mode-watcher';

    import { Button } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

    import { m } from '$lib/paraglide/messages';

    const modes = [
        { value: 'light', label: m.theme_light, icon: SunIcon },
        { value: 'dark', label: m.theme_dark, icon: MoonIcon },
        { value: 'system', label: m.theme_system, icon: MonitorIcon }
    ] as const;

    type ModeValue = (typeof modes)[number]['value'];

    function isMode(value: string): value is ModeValue {
        return modes.some((mode) => mode.value === value);
    }
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger aria-label={m.theme_toggle_label()}>
        {#snippet child({ props })}
            <Button {...props} variant="ghost" size="icon-sm">
                <SunIcon class="dark:hidden" />
                <MoonIcon class="hidden dark:block" />
            </Button>
        {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
        <DropdownMenu.RadioGroup
            value={userPrefersMode.current}
            onValueChange={(value) => {
                if (isMode(value)) setMode(value);
            }}
        >
            {#each modes as mode (mode.value)}
                <DropdownMenu.RadioItem value={mode.value}>
                    <mode.icon />
                    {mode.label()}
                </DropdownMenu.RadioItem>
            {/each}
        </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
</DropdownMenu.Root>
