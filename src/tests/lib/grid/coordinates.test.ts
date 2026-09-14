import { describe, expect, it } from 'vitest';

import { cellReference, columnLetter } from '$lib/grid/coordinates';

describe('columnLetter', () => {
    it.each([
        [0, 'A'],
        [1, 'B'],
        [25, 'Z'],
        [26, 'AA'],
        [51, 'AZ'],
        [52, 'BA'],
        [701, 'ZZ'],
        [702, 'AAA']
    ])('column %i is %s', (index, letters) => {
        expect(columnLetter(index)).toBe(letters);
    });
});

describe('cellReference', () => {
    it('uses one-based rows like a spreadsheet', () => {
        expect(cellReference(0, 0)).toBe('A1');
        expect(cellReference(9, 27)).toBe('AB10');
    });
});
