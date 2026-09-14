<script lang="ts">
    import './layout.css';

    import { ModeWatcher } from 'mode-watcher';

    import * as Tooltip from '$lib/components/ui/tooltip';

    import favicon from '$lib/assets/favicon.svg';
    import { m } from '$lib/paraglide/messages';

    let { children } = $props();
</script>

<svelte:head>
    <title>{m.app_title()}</title>
    <link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

<Tooltip.Provider>
    {@render children()}
</Tooltip.Provider>
