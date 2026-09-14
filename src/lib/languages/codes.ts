// Kept free of UI imports: the spellcheck worker imports this module.

/** The only languages the app supports, in display order. */
export const LANGUAGE_CODES = [
    'en-GB',
    'en-US',
    'fr',
    'de',
    'it',
    'es'
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

/** A column is either checked in one language or ignored. */
export type ColumnLanguage = LanguageCode | 'none';

export function isLanguageCode(value: string): value is LanguageCode {
    return (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function isColumnLanguage(value: string): value is ColumnLanguage {
    return value === 'none' || isLanguageCode(value);
}
