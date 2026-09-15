<script lang="ts">
    import type { IHeaderCellProps } from 'wx-svelte-grid';

    import { m } from '$lib/paraglide/messages';

    // SVAR passes every header cell these props; the corner only needs to
    // know which column it heads.
    let { column }: IHeaderCellProps = $props();
</script>

<!-- The blank top-left corner still names its column for screen readers. -->
<span class="sr-only" data-grid-column={column.id}>
    {m.grid_row_numbers_label()}
</span>
