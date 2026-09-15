import { describe, expect, it } from 'vitest';

import { findMisspellings, ignoreKey } from '$lib/spellcheck/tokenize';

const known = new Set(['loves', 'the', 'parcel']);
const check = (word: string) => known.has(word.toLowerCase());

describe('ignored words', () => {
    it('keys words case-insensitively with straight apostrophes', () => {
        expect(ignoreKey('Hikking')).toBe('hikking');
        expect(ignoreKey('Dont’')).toBe("dont'");
    });

    it('skips ignored words whatever their case', () => {
        const text = 'Loves Hikking and hikking';
        expect(findMisspellings(text, check)).toHaveLength(3);
        expect(findMisspellings(text, check, new Set(['hikking']))).toEqual([
            { start: 14, end: 17 }
        ]);
    });

    it('ignores one part of a hyphenated compound on its own', () => {
        expect(
            findMisspellings('the parcel-trakcer', check, new Set(['trakcer']))
        ).toEqual([]);
    });
});
