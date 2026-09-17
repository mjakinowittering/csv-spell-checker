import { describe, expect, it, vi } from 'vitest';

import type { LanguageCode } from '$lib/languages/codes';
import { resolveFallbacks } from '$lib/spellcheck/fallback';
import type { WordCheck } from '$lib/spellcheck/tokenize';

/** Dictionaries that accept only the words listed for each language. */
function dictionaries(known: Partial<Record<LanguageCode, string[]>>) {
    const loaded: LanguageCode[] = [];
    const checkerFor = vi.fn(async (language: LanguageCode) => {
        loaded.push(language);
        const words = known[language];
        return words
            ? (((word) =>
                  words.includes(word.toLowerCase())) satisfies WordCheck)
            : null;
    });
    return { checkerFor, loaded };
}

describe('resolveFallbacks', () => {
    it('records the first language in the chain that accepts a word', async () => {
        const { checkerFor } = dictionaries({
            'en-GB': ['waterproof'],
            nl: ['waterdicht']
        });

        const matches = await resolveFallbacks(
            ['waterproof', 'waterdicht', 'xyzzq'],
            'de',
            checkerFor
        );

        expect(matches.get('waterproof')).toBe('en-GB');
        expect(matches.get('waterdicht')).toBe('nl');
        // Nothing in the chain knew it, so it stays flagged.
        expect(matches.get('xyzzq')).toBeNull();
    });

    it('stops loading dictionaries once every word has matched', async () => {
        const { checkerFor, loaded } = dictionaries({
            'en-GB': ['waterproof']
        });

        await resolveFallbacks(['waterproof'], 'de', checkerFor);

        // German's chain is en-GB, en-US, nl: the last two are never needed.
        expect(loaded).toEqual(['en-GB']);
    });

    it('loads nothing when there are no failing words', async () => {
        const { checkerFor, loaded } = dictionaries({ 'en-GB': ['anything'] });
        const matches = await resolveFallbacks([], 'de', checkerFor);
        expect(matches.size).toBe(0);
        expect(loaded).toEqual([]);
    });

    it('carries on past a dictionary that cannot be loaded', async () => {
        const { checkerFor, loaded } = dictionaries({ nl: ['waterdicht'] });

        const matches = await resolveFallbacks(
            ['waterdicht'],
            'de',
            checkerFor
        );

        expect(matches.get('waterdicht')).toBe('nl');
        expect(loaded).toEqual(['en-GB', 'en-US', 'nl']);
    });

    it('checks a repeated word once', async () => {
        const known = ['waterproof'];
        const checkerFor = vi.fn(async () => {
            const check: WordCheck = (word) => known.includes(word);
            return check;
        });
        const checked = vi.fn();

        const matches = await resolveFallbacks(
            ['waterproof', 'waterproof', 'waterproof'],
            'de',
            async (language) => {
                checked(language);
                return checkerFor();
            }
        );

        expect(matches.size).toBe(1);
        expect(checked).toHaveBeenCalledTimes(1);
    });
});
