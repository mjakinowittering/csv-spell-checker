import { describe, expect, it } from 'vitest';

import { segments } from '$lib/spellcheck/segments';

describe('segments', () => {
    it('returns the whole text when nothing is misspelled', () => {
        expect(segments('all fine', [])).toEqual([
            { text: 'all fine', misspelled: false }
        ]);
    });

    it('splits around misspelled ranges in order', () => {
        expect(
            segments('Recieves mail and hikking', [
                { start: 18, end: 25 },
                { start: 0, end: 8 }
            ])
        ).toEqual([
            { text: 'Recieves', misspelled: true },
            { text: ' mail and ', misspelled: false },
            { text: 'hikking', misspelled: true }
        ]);
    });

    it('ignores overlapping or out-of-range ranges', () => {
        expect(
            segments('abc def', [
                { start: 0, end: 3 },
                { start: 1, end: 2 },
                { start: 4, end: 99 }
            ])
        ).toEqual([
            { text: 'abc', misspelled: true },
            { text: ' def', misspelled: false }
        ]);
    });
});
