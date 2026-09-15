<script lang="ts">
    import { m } from '$lib/paraglide/messages';
</script>

<!-- The same classes as the grid's cells, so the swatches always match. -->
<span class="flex items-center gap-1.5">
    <span
        aria-hidden="true"
        class="sheet-cell-flagged-sample rounded-sm px-1 leading-4"
    >
        abc
    </span>
    {m.status_legend_flagged()}
</span>
<span class="flex items-center gap-1.5">
    <span aria-hidden="true" class="sheet-cell-edited size-3 rounded-sm border"
    ></span>
    {m.status_legend_edited()}
</span>
