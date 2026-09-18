// Kept free of UI and worker APIs: shared by the spellcheck worker and tests.

import type { LanguageCode } from '$lib/languages/codes';

import { isSpelledCorrectly, type WordCheck } from './tokenize';

/**
 * Languages that build compounds freely from existing words. Their
 * dictionaries hold the parts, not every compound, so "Hundewindeln" and
 * "Taillenumfang" are rejected although "Hunde", "Windeln", "Taille" and
 * "Umfang" all pass.
 */
const COMPOUNDING: readonly LanguageCode[] = ['de', 'nl', 'sv', 'da', 'nb'];

/** The linking letters a compound puts between its parts (Fugenlaute). */
const GLUES = ['s', 'es', 'n', 'en', 'e', 'er'];

/** Below this, a "part" is a fragment of a misspelling, not a word. */
const MIN_PART = 3;

/** Three parts covers Stubenreinheitstraining; more invites nonsense. */
const MAX_PARTS = 3;

/**
 * `check`, extended to accept a compound of dictionary words in the languages
 * that form them. Splitting is only ever tried on a word the dictionary has
 * already rejected, and each result is cached for the checker's life, so the
 * cost falls on misspellings alone.
 *
 * Every part is matched case-insensitively, like any other word, which is what
 * lets a lower-case "hundewindeln" split into "Hunde" and "Windeln".
 */
export function compoundAware(
    language: LanguageCode,
    check: WordCheck
): WordCheck {
    if (!COMPOUNDING.includes(language)) return check;

    const known = new Map<string, boolean>();
    return (word) => {
        if (check(word)) return true;
        const key = word.toLocaleLowerCase();
        let compound = known.get(key);
        if (compound === undefined) {
            compound = splitsIntoWords(key, check, MAX_PARTS);
            known.set(key, compound);
        }
        return compound;
    };
}

/** Whether `word` splits into at most `parts` dictionary words. */
function splitsIntoWords(
    word: string,
    check: WordCheck,
    parts: number
): boolean {
    if (word.length < MIN_PART * 2) return false;
    for (let at = MIN_PART; at <= word.length - MIN_PART; at += 1) {
        if (!isLeadingPart(word.slice(0, at), check)) continue;
        const rest = word.slice(at);
        if (isSpelledCorrectly(rest, check)) return true;
        if (parts > 2 && splitsIntoWords(rest, check, parts - 1)) return true;
    }
    return false;
}

/** A part before the last one, which may carry a linking letter. */
function isLeadingPart(part: string, check: WordCheck): boolean {
    if (isSpelledCorrectly(part, check)) return true;
    return GLUES.some(
        (glue) =>
            part.endsWith(glue) &&
            part.length - glue.length >= MIN_PART &&
            isSpelledCorrectly(part.slice(0, -glue.length), check)
    );
}
