<script lang="ts">
    import type { LucideIcon } from '@lucide/svelte';

    import { Button } from '$lib/components/ui/button';
    import * as Tooltip from '$lib/components/ui/tooltip';

    let {
        icon: Icon,
        label,
        disabled = false,
        onclick
    }: {
        icon: LucideIcon;
        label: string;
        disabled?: boolean;
        onclick?: () => void;
    } = $props();
</script>

<Tooltip.Root>
    <Tooltip.Trigger {disabled} {onclick} aria-label={label}>
        {#snippet child({ props })}
            <Button {...props} variant="ghost" size="icon-sm">
                <Icon />
            </Button>
        {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>{label}</Tooltip.Content>
</Tooltip.Root>
