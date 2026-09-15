import { describe, expect, it } from 'vitest';

import { matchCase, replaceWord } from '$lib/spellcheck/tokenize';

describe('replaceWord', () => {
    it('replaces every capitalisation of a whole word, each its own way', () => {
        const replacements: Record<string, string> = {
            Trés: 'Très',
            trés: 'très'
        };
        expect(
            replaceWord(
                'Trés bien, trés Trésor',
                'trés',
                (word) => replacements[word] ?? null
            )
        ).toBe('Très bien, très Trésor');
    });

    it('leaves a spelling alone when there is no replacement for it', () => {
        expect(
            replaceWord('Trés bien, trés doux', 'trés', (word) =>
                word === 'trés' ? 'très' : null
            )
        ).toBe('Trés bien, très doux');
    });

    it('replaces one part of a hyphenated compound', () => {
        expect(replaceWord('porte-clefz neuf', 'clefz', () => 'clefs')).toBe(
            'porte-clefs neuf'
        );
    });

    it('matches curly and straight apostrophes alike', () => {
        expect(
            replaceWord('Il faut qu’ill vienne', "qu'ill", () => "qu'il")
        ).toBe("Il faut qu'il vienne");
    });

    it('leaves text without the word unchanged', () => {
        expect(replaceWord('Très bien', 'macher', () => 'mâcher')).toBe(
            'Très bien'
        );
    });
});

describe('matchCase', () => {
    it('sets the first letter’s case from the word, both ways', () => {
        expect(matchCase('Trés', 'très')).toBe('Très');
        expect(matchCase('trés', 'Très')).toBe('très');
        expect(matchCase('trés', 'très')).toBe('très');
    });
});
