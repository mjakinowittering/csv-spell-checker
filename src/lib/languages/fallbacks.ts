// Kept free of UI and worker APIs: shared by the spellcheck worker and tests.

import type { LanguageCode } from './codes';

/**
 * Tried first for every language: spreadsheets of product copy are full of
 * English brand, unit and marketing words whatever the sheet's language.
 */
const ENGLISH: readonly LanguageCode[] = ['en-GB', 'en-US'];

/**
 * Languages close enough to share vocabulary — "root languages". A word that
 * fails Spanish is tried against its Romance siblings, never against Polish,
 * which keeps a fallback from accepting an unrelated misspelling.
 */
const FAMILIES: readonly (readonly LanguageCode[])[] = [
    ['en-GB', 'en-US'],
    ['fr', 'it', 'es', 'pt-PT', 'pt-BR'],
    ['de', 'nl'],
    ['pl', 'cs'],
    ['sv', 'da', 'nb']
];

const chains = new Map<LanguageCode, readonly LanguageCode[]>();

/**
 * The languages to try, in order, when a word fails `primary`: English first,
 * then `primary`'s family. The chain's length is the cap — a word is flagged
 * once every one of them has rejected it.
 */
export function fallbackChain(primary: LanguageCode): readonly LanguageCode[] {
    const cached = chains.get(primary);
    if (cached) return cached;

    const family =
        FAMILIES.find((languages) => languages.includes(primary)) ?? [];
    const chain = [...ENGLISH, ...family].filter(
        (language, index, all) =>
            language !== primary && all.indexOf(language) === index
    );
    chains.set(primary, chain);
    return chain;
}
