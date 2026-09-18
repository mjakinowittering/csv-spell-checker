import { readFileSync } from 'node:fs';

import { createHunspellFromStrings, type Hunspell } from 'hunspell-wasm';
import { beforeAll, describe, expect, it } from 'vitest';

import { suggestionsFor } from '$lib/spellcheck/suggestions';

function load(pkg: string): Promise<Hunspell> {
    return createHunspellFromStrings(
        readFileSync(`node_modules/${pkg}/index.aff`, 'utf8'),
        readFileSync(`node_modules/${pkg}/index.dic`, 'utf8')
    );
}

describe('suggestionsFor', () => {
    it('leaves out a suggestion that only changes the word’s case', () => {
        // Hunspell answers a lower-case German noun with the capitalised
        // spelling, which would come back case-matched as the word itself.
        const lists: Record<string, string[]> = {
            Geruchsentferner: ['Geruchsentferner', 'Geruchsentfernern'],
            geruchsentferner: []
        };
        expect(
            suggestionsFor('geruchsentferner', (word) => lists[word] ?? [])
        ).toEqual(['geruchsentfernern']);
    });

    it('merges a capitalised lookup first, deduplicates and keeps three', () => {
        const lists: Record<string, string[]> = {
            Trés: ['Très', 'Prés', 'Trais'],
            trés: ['trais']
        };
        expect(suggestionsFor('trés', (word) => lists[word] ?? [])).toEqual([
            'très',
            'prés',
            'trais'
        ]);
        expect(suggestionsFor('Trés', (word) => lists[word] ?? [])).toEqual([
            'Très',
            'Prés',
            'Trais'
        ]);
    });
});

describe('suggestionsFor with real dictionaries', { timeout: 60_000 }, () => {
    let french: Hunspell;
    let english: Hunspell;
    beforeAll(async () => {
        [french, english] = await Promise.all([
            load('dictionary-fr'),
            load('dictionary-en-gb')
        ]);
    });

    const frenchFor = (word: string) =>
        suggestionsFor(word, (lookup) => french.getSpellingSuggestions(lookup));
    const englishFor = (word: string) =>
        suggestionsFor(word, (lookup) =>
            english.getSpellingSuggestions(lookup)
        );

    it('gives every capitalisation the same correction, in its own case', () => {
        // On its own, Hunspell suggests "trais" for lowercase "trés".
        expect(french.getSpellingSuggestions('trés')[0]).toBe('trais');
        expect(frenchFor('trés')[0]).toBe('très');
        expect(frenchFor('Trés')[0]).toBe('Très');
    });

    it.each([
        ['macher', 'mâcher'],
        ['Macher', 'Mâcher'],
        ['nettoye', 'nettoie'],
        ['facil', 'facile'],
        ['vittesse', 'vitesse']
    ])('French %s → %s', (word, expected) => {
        expect(frenchFor(word)[0]).toBe(expected);
    });

    it('keeps English corrections, lower-casing a proper noun to match', () => {
        expect(englishFor('hikking')[0]).toBe('hiking');
        expect(englishFor('Recieve')[0]).toBe('Receive');
        expect(englishFor('londn')[0]).toBe('london');
    });
});
