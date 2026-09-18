import { describe, expect, it } from 'vitest';

import { findMisspellings, tokenize } from '$lib/spellcheck/tokenize';

const words = (text: string) => tokenize(text).map((token) => token.word);

describe('tokenize', () => {
    it('finds words with their offsets', () => {
        expect(tokenize('Loves hikking!')).toEqual([
            { word: 'Loves', start: 0, end: 5 },
            { word: 'hikking', start: 6, end: 13 }
        ]);
    });

    it('keeps internal apostrophes and accented letters', () => {
        expect(words("Don't l’homme niños Straße")).toEqual([
            "Don't",
            'l’homme',
            'niños',
            'Straße'
        ]);
    });

    it('checks hyphenated compounds part by part, with correct offsets', () => {
        expect(tokenize('well-knwon')).toEqual([
            { word: 'well', start: 0, end: 4 },
            { word: 'knwon', start: 5, end: 10 }
        ]);
    });

    it('skips codes, acronyms, single letters, URLs and e-mail addresses', () => {
        expect(
            words(
                'SKU-12 v2 user_id NASA a I https://exmaple.com/pth www.exmaple.org ada@exmaple.com ok'
            )
        ).toEqual(['ok']);
    });

    it('keeps offsets valid after skipped spans', () => {
        const text = 'see https://x.io/aa then recieve';
        const tokens = tokenize(text);
        expect(tokens.map((token) => token.word)).toEqual([
            'see',
            'then',
            'recieve'
        ]);
        for (const { word, start, end } of tokens) {
            expect(text.slice(start, end)).toBe(word);
        }
    });
});

describe('findMisspellings', () => {
    const dictionary = new Set(['loves', 'hiking', 'homme', "don't", 'the']);
    const check = (word: string) => dictionary.has(word.toLowerCase());

    it('returns the ranges of rejected words only', () => {
        const text = 'Loves hikking the hiking';
        const ranges = findMisspellings(text, check);
        expect(ranges.map(({ start, end }) => text.slice(start, end))).toEqual([
            'hikking'
        ]);
    });

    it('accepts elisions when the elided word is correct', () => {
        expect(findMisspellings("l'homme l’homme l'hommme", check)).toEqual([
            { start: 16, end: 24 }
        ]);
    });

    it('normalises curly apostrophes before checking', () => {
        expect(findMisspellings('Don’t', check)).toEqual([]);
    });
});

describe('case', () => {
    // German nouns are capitalised in the dictionary; the data is not.
    const check = (word: string) => ['Hunde', 'sehr', 'Trés'].includes(word);

    it('accepts a word whatever its capitalisation', () => {
        expect(findMisspellings('hunde Hunde HUNDE', check)).toEqual([]);
        expect(findMisspellings('Sehr sehr', check)).toEqual([]);
    });

    it('still flags a word no capitalisation rescues', () => {
        expect(
            findMisspellings('hunde windl', check).map(({ start, end }) =>
                'hunde windl'.slice(start, end)
            )
        ).toEqual(['windl']);
    });
});
