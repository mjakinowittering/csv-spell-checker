// Kept free of UI and worker APIs: shared by the spellcheck worker and tests.

import { MAX_SUGGESTIONS } from './protocol';
import { matchCase } from './tokenize';

/**
 * Suggestions for a misspelled word, best first, in the word's own case.
 *
 * Hunspell gives a lowercase word far fewer, and often worse, suggestions than
 * the same word capitalised ("trés" → trais, but "Trés" → Très, Prés, Trais).
 * So a word starting in lower case is also looked up capitalised; those
 * suggestions come first, lower-cased to match, then the word's own. Every
 * capitalisation of a word therefore gets the same corrections, in the same
 * order, which is what lets a fix keep each occurrence's case.
 */
export function suggestionsFor(
    word: string,
    suggest: (word: string) => readonly string[]
): string[] {
    const first = word.charAt(0);
    const lowerInitial = first !== first.toUpperCase();
    const capitalised = lowerInitial
        ? suggest(first.toUpperCase() + word.slice(1)).map((suggestion) =>
              matchCase(word, suggestion)
          )
        : [];

    const result: string[] = [];
    for (const suggestion of [...capitalised, ...suggest(word)]) {
        if (result.includes(suggestion)) continue;
        result.push(suggestion);
        if (result.length === MAX_SUGGESTIONS) break;
    }
    return result;
}
