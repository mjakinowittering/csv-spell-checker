import { readFileSync } from 'node:fs';

import Typo from 'typo-js';
import { describe, expect, it } from 'vitest';

import { findMisspellings } from '$lib/spellcheck/tokenize';

// The same Typo.js + Hunspell dictionaries the worker loads, read from the
// dictionary packages directly.
function checkerFor(pkg: string, language: string) {
    const file = (name: string) =>
        readFileSync(`node_modules/${pkg}/${name}`, 'utf8');
    const typo = new Typo(language, file('index.aff'), file('index.dic'));
    return (word: string) => typo.check(word);
}

function misspelled(text: string, check: (word: string) => boolean) {
    return findMisspellings(text, check).map(({ start, end }) =>
        text.slice(start, end)
    );
}

describe('real dictionaries', { timeout: 30_000 }, () => {
    it('English (UK) accepts British spelling and flags typos', () => {
        const check = checkerFor('dictionary-en-gb', 'en-GB');
        expect(
            misspelled("Sarah's favourite colour, don't recieve hikking", check)
        ).toEqual(['recieve', 'hikking']);
    });

    it('English (US) rejects British spelling', () => {
        const check = checkerFor('dictionary-en', 'en-US');
        expect(misspelled('favorite color, favourite colour', check)).toEqual([
            'favourite',
            'colour'
        ]);
    });

    it('French accepts elisions and accents', () => {
        const check = checkerFor('dictionary-fr', 'fr');
        expect(
            misspelled("L'homme a reçu la chaise abîmée, bonjuor", check)
        ).toEqual(['bonjuor']);
    });

    it('German accepts umlauts and ß', () => {
        const check = checkerFor('dictionary-de', 'de');
        expect(misspelled('Die Häuser an der Straße, Hauss', check)).toEqual([
            'Hauss'
        ]);
    });

    it('Spanish accepts accents and ñ', () => {
        const check = checkerFor('dictionary-es', 'es');
        expect(misspelled('Los niños llegó mañana, cassa', check)).toEqual([
            'cassa'
        ]);
    });
});
