<script lang="ts">
    import SheetTabs from '$lib/components/shell/SheetTabs.svelte';
    import StatusBar from '$lib/components/shell/StatusBar.svelte';
    import Toolbar from '$lib/components/shell/Toolbar.svelte';

    import { Workbook } from '$lib/workbook/workbook.svelte';

    const workbook = new Workbook();
</script>

<div class="bg-background flex h-dvh flex-col">
    <Toolbar
        issueCount={0}
        hasSheet={workbook.active !== null}
        canUndo={false}
        canRedo={false}
    />

    <main class="min-h-0 flex-1 overflow-hidden"></main>

    <SheetTabs
        sheets={workbook.sheets}
        activeId={workbook.activeId}
        onactivate={(id) => workbook.activate(id)}
        onclose={(id) => workbook.close(id)}
    />

    <StatusBar rowCount={workbook.active?.rows.length ?? null} />
</div>
