import { describe, expect, it } from 'vitest';

import { replaceWord } from '$lib/spellcheck/tokenize';

describe('replaceWord', () => {
    it('replaces whole words only, matching capitalisation', () => {
        expect(replaceWord('Trés bien, trés Trésor', 'trés', 'très')).toBe(
            'Très bien, très Trésor'
        );
    });

    it('replaces one part of a hyphenated compound', () => {
        expect(replaceWord('porte-clefz neuf', 'clefz', 'clefs')).toBe(
            'porte-clefs neuf'
        );
    });

    it('matches curly and straight apostrophes alike', () => {
        expect(replaceWord('Il faut qu’ill vienne', "qu'ill", "qu'il")).toBe(
            "Il faut qu'il vienne"
        );
    });

    it('leaves text without the word unchanged', () => {
        expect(replaceWord('Très bien', 'macher', 'mâcher')).toBe('Très bien');
    });
});
