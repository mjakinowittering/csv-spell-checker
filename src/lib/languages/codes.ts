// Kept free of UI imports: the spellcheck worker imports this module.

/**
 * The only languages the app supports, in display order. Each has a Hunspell
 * dictionary copied by scripts/copy-dictionaries.js.
 */
export const LANGUAGE_CODES = [
    'en-GB',
    'en-US',
    'fr',
    'de',
    'it',
    'es',
    'pt-PT',
    'pt-BR',
    'nl',
    'pl',
    'sv',
    'da',
    'nb',
    'cs'
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

/**
 * A column is checked in one supported language, deliberately ignored
 * (`none`), or detected as a language the app cannot check (`unsupported`).
 * Only supported languages are ever spell-checked.
 */
export type ColumnLanguage = LanguageCode | 'none' | 'unsupported';

export function isLanguageCode(value: string): value is LanguageCode {
    return (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function isColumnLanguage(value: string): value is ColumnLanguage {
    return value === 'none' || value === 'unsupported' || isLanguageCode(value);
}
