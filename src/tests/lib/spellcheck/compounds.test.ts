import { describe, expect, it } from 'vitest';

import { compoundAware } from '$lib/spellcheck/compounds';

// A dictionary holding the parts, capitalised as a German one would.
const WORDS = new Set([
    'Hunde',
    'Hund',
    'Windeln',
    'Windel',
    'Taille',
    'Umfang',
    'Stube',
    'Stuben',
    'Reinheit',
    'Training',
    'Maschine',
    'waschbar',
    'Urin',
    'Flecken',
    'rein'
]);
const dictionary = (word: string) => WORDS.has(word);

describe('compoundAware', () => {
    const check = compoundAware('de', dictionary);

    it('accepts a compound of two dictionary words, whatever its case', () => {
        expect(dictionary('Hundewindeln')).toBe(false);
        expect(check('Hundewindeln')).toBe(true);
        expect(check('hundewindeln')).toBe(true);
    });

    it('accepts a linking letter between the parts', () => {
        // Taille + n + Umfang, Maschine + n + waschbar.
        expect(check('Taillenumfang')).toBe(true);
        expect(check('maschinenwaschbare')).toBe(false);
        expect(check('Maschinenwaschbar')).toBe(true);
    });

    it('accepts three parts, but not four', () => {
        expect(check('Stubenreinheitstraining')).toBe(true);
        expect(check('Hundewindelurinflecken')).toBe(false);
    });

    it('still rejects a misspelling, inside a compound or alone', () => {
        expect(check('Hundewindlen')).toBe(false);
        expect(check('Urinfelcken')).toBe(false);
        expect(check('Hauss')).toBe(false);
    });

    it('never accepts a fragment shorter than three letters as a part', () => {
        // Urin + rein would otherwise make "Urinre" plausible.
        expect(check('Urinre')).toBe(false);
    });

    it('leaves a language that does not compound alone', () => {
        const french = compoundAware('fr', dictionary);
        expect(french('Hundewindeln')).toBe(false);
        expect(french('Hunde')).toBe(true);
    });
});
