import { m } from '$lib/paraglide/messages';

import type { ColumnLanguage, LanguageCode } from './codes';

export const languageLabel: Record<LanguageCode | 'none', () => string> = {
    'en-GB': m.languages_en_gb,
    'en-US': m.languages_en_us,
    fr: m.languages_fr,
    de: m.languages_de,
    it: m.languages_it,
    es: m.languages_es,
    'pt-PT': m.languages_pt_pt,
    'pt-BR': m.languages_pt_br,
    nl: m.languages_nl,
    pl: m.languages_pl,
    sv: m.languages_sv,
    da: m.languages_da,
    nb: m.languages_nb,
    cs: m.languages_cs,
    none: m.languages_none
};

const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });

/** The English name of any BCP 47 language code, e.g. `pl` → "Polish". */
export function languageName(code: string): string {
    try {
        return displayNames.of(code) ?? code;
    } catch {
        return code;
    }
}

/**
 * The label for a column language. `unsupported` names the detected language
 * when it is known, so the user can see what will not be checked.
 */
export function columnLanguageLabel(
    language: ColumnLanguage,
    detected: string | null = null
): string {
    if (language !== 'unsupported') return languageLabel[language]();
    return detected
        ? m.languages_unsupported({ language: languageName(detected) })
        : m.languages_unsupported_unknown();
}
