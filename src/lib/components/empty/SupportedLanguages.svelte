<script lang="ts">
    import { Badge } from '$lib/components/ui/badge';

    import { LANGUAGE_CODES, type LanguageCode } from '$lib/languages/codes';
    import { languageLabel } from '$lib/languages/labels';
    import { m } from '$lib/paraglide/messages';

    let {
        languages = LANGUAGE_CODES
    }: {
        /** The languages listed as chips; every supported one by default. */
        languages?: readonly LanguageCode[];
    } = $props();
</script>

<div class="flex flex-col items-center gap-2">
    <h2 class="text-muted-foreground text-xs font-medium">
        {m.empty_languages_title()}
    </h2>
    <ul class="flex flex-wrap justify-center gap-2">
        {#each languages as code (code)}
            <li>
                <Badge variant="secondary">{languageLabel[code]()}</Badge>
            </li>
        {/each}
    </ul>
</div>
