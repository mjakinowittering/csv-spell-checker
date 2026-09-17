import { readFileSync } from 'node:fs';

import { createHunspellFromStrings } from 'hunspell-wasm';
import { describe, expect, it } from 'vitest';

import { resolveFallbacks } from '$lib/spellcheck/fallback';
import { findMisspellings } from '$lib/spellcheck/tokenize';

// The same hunspell-wasm build and dictionaries the worker loads, read from
// the dictionary packages directly.
async function checkerFor(pkg: string) {
    const file = (name: string) =>
        readFileSync(`node_modules/${pkg}/${name}`, 'utf8');
    const hunspell = await createHunspellFromStrings(
        file('index.aff'),
        file('index.dic')
    );
    return (word: string) => hunspell.testSpelling(word);
}

async function misspelled(pkg: string, text: string) {
    const check = await checkerFor(pkg);
    return findMisspellings(text, check).map(({ start, end }) =>
        text.slice(start, end)
    );
}

describe('fallback chain with real dictionaries', { timeout: 60_000 }, () => {
    it('accepts English and Polish words in a German cell, but not a typo', async () => {
        const hunspellFor = async (pkg: string) =>
            createHunspellFromStrings(
                readFileSync(`node_modules/${pkg}/index.aff`, 'utf8'),
                readFileSync(`node_modules/${pkg}/index.dic`, 'utf8')
            );
        const packages: Partial<Record<string, string>> = {
            'en-GB': 'dictionary-en-gb',
            'en-US': 'dictionary-en',
            nl: 'dictionary-nl',
            pl: 'dictionary-pl',
            cs: 'dictionary-cs'
        };

        const matches = await resolveFallbacks(
            ['waterproof', 'chłonna', 'Hauss'],
            'de',
            async (language) => {
                const pkg = packages[language];
                if (!pkg) return null;
                const hunspell = await hunspellFor(pkg);
                return (word: string) => hunspell.testSpelling(word);
            }
        );

        expect(matches.get('waterproof')).toBe('en-GB');
        // German's neighbours include Polish, so embedded Polish copy passes.
        expect(matches.get('chłonna')).toBe('pl');
        // A German typo is not a word in any of them, so it stays flagged.
        expect(matches.get('Hauss')).toBeNull();
    });
});

describe('real dictionaries', { timeout: 60_000 }, () => {
    it('ranks the likely correction first', async () => {
        const hunspellFor = (pkg: string) =>
            createHunspellFromStrings(
                readFileSync(`node_modules/${pkg}/index.aff`, 'utf8'),
                readFileSync(`node_modules/${pkg}/index.dic`, 'utf8')
            );
        const french = await hunspellFor('dictionary-fr');
        expect(french.getSpellingSuggestions('Trés')[0]).toBe('Très');
        expect(french.getSpellingSuggestions('macher')[0]).toBe('mâcher');
        expect(french.getSpellingSuggestions('vittesse')[0]).toBe('vitesse');
        const english = await hunspellFor('dictionary-en-gb');
        expect(english.getSpellingSuggestions('hikking')[0]).toBe('hiking');
    });

    it('English (UK) accepts British spelling and flags typos', async () => {
        expect(
            await misspelled(
                'dictionary-en-gb',
                "Sarah's favourite colour, don't recieve hikking"
            )
        ).toEqual(['recieve', 'hikking']);
    });

    it('English (US) rejects British spelling', async () => {
        expect(
            await misspelled(
                'dictionary-en',
                'favorite color, favourite colour'
            )
        ).toEqual(['favourite', 'colour']);
    });

    it('French accepts elisions and accents', async () => {
        expect(
            await misspelled(
                'dictionary-fr',
                "L'homme a reçu la chaise abîmée, bonjuor"
            )
        ).toEqual(['bonjuor']);
    });

    it('German accepts umlauts and ß', async () => {
        expect(
            await misspelled('dictionary-de', 'Die Häuser an der Straße, Hauss')
        ).toEqual(['Hauss']);
    });

    it.each([
        [
            'Italian',
            'dictionary-it',
            'La città è bellissima, perché piove? Grazzie',
            'Grazzie'
        ],
        ['Spanish', 'dictionary-es', 'Los niños llegó mañana, cassa', 'cassa'],
        [
            'Portuguese (Portugal)',
            'dictionary-pt-pt',
            'A informação chegou ontem à tarde, obrigadu',
            'obrigadu'
        ],
        [
            'Portuguese (Brazil)',
            'dictionary-pt',
            'Você recebeu a informação ontem, obrigadu',
            'obrigadu'
        ],
        [
            'Dutch',
            'dictionary-nl',
            'Het meisje leest een boek in de tuin, huiz',
            'huiz'
        ],
        [
            'Polish',
            'dictionary-pl',
            'Dziękuję za książkę, pozdrawiam, ksiazka',
            'ksiazka'
        ],
        [
            'Swedish',
            'dictionary-sv',
            'Jag älskar böcker och kaffe, tackk',
            'tackk'
        ],
        [
            'Danish',
            'dictionary-da',
            'Jeg elsker bøger og kaffe om søndagen, takkk',
            'takkk'
        ],
        [
            'Norwegian (Bokmål)',
            'dictionary-nb',
            'Jeg liker å lese bøker på søndag, takkk',
            'takkk'
        ],
        [
            'Czech',
            'dictionary-cs',
            'Děkuji za knihu, přeji hezký den, dekuji',
            'dekuji'
        ]
    ])(
        '%s accepts its accented words and flags a typo',
        async (_, pkg, text, typo) => {
            expect(await misspelled(pkg, text)).toEqual([typo]);
        }
    );
});
