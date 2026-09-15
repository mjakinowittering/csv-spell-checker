// Kept free of UI imports: the spellcheck worker imports this module.

/**
 * The only languages the app supports, in display order. Italian is descoped:
 * Typo.js cannot load an Italian Hunspell dictionary.
 */
export const LANGUAGE_CODES = ['en-GB', 'en-US', 'fr', 'de', 'es'] as const;

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
