<script lang="ts">
    import type { Snippet } from 'svelte';

    import * as Tooltip from '$lib/components/ui/tooltip';

    let { children }: { children: Snippet } = $props();
</script>

<!-- What the root layout provides the app: tooltips need their provider. -->
<Tooltip.Provider>
    {@render children()}
</Tooltip.Provider>
