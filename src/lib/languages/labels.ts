import { m } from '$lib/paraglide/messages';

import type { ColumnLanguage } from './codes';

export const languageLabel: Record<ColumnLanguage, () => string> = {
    'en-GB': m.languages_en_gb,
    'en-US': m.languages_en_us,
    fr: m.languages_fr,
    de: m.languages_de,
    es: m.languages_es,
    none: m.languages_none
};
