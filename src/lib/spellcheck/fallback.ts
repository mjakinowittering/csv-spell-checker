// Kept free of UI and worker APIs: shared by the spellcheck worker and tests.

import type { LanguageCode } from '$lib/languages/codes';
import { fallbackChain } from '$lib/languages/fallbacks';

import { isSpelledCorrectly, type WordCheck } from './tokenize';

/**
 * Which language accepts each word that its cell's primary language rejected:
 * the primary's fallback chain in order, stopping at the first match, and null
 * for a word every language rejected (that word is flagged).
 *
 * `checkerFor` is asked for a dictionary only when a word still has no match,
 * so a fallback language loads the first time a sheet actually needs it — and
 * never at all for a sheet whose words all pass. It returns null when the
 * dictionary cannot be loaded, which simply moves on to the next language.
 */
export async function resolveFallbacks(
    words: Iterable<string>,
    primary: LanguageCode,
    checkerFor: (language: LanguageCode) => Promise<WordCheck | null>
): Promise<Map<string, LanguageCode | null>> {
    const matches = new Map<string, LanguageCode | null>();
    let unresolved = [...new Set(words)];
    if (unresolved.length === 0) return matches;

    for (const language of fallbackChain(primary)) {
        const check = await checkerFor(language);
        if (!check) continue;
        const stillFailing: string[] = [];
        for (const word of unresolved) {
            if (isSpelledCorrectly(word, check)) matches.set(word, language);
            else stillFailing.push(word);
        }
        unresolved = stillFailing;
        if (unresolved.length === 0) return matches;
    }

    for (const word of unresolved) matches.set(word, null);
    return matches;
}
