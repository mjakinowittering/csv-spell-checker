<script lang="ts">
    import type { ICellProps } from 'wx-svelte-grid';

    let { row }: ICellProps = $props();

    // Spreadsheet row numbers are one-based and the header is row 1, so the
    // sheet row index (header = 0) plus one.
    const label = $derived(Number(row.id) + 1);
</script>

<span class="block w-full text-center">{label}</span>
