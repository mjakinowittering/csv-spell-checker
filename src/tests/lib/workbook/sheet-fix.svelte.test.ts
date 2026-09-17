import { describe, expect, it } from 'vitest';

import type { CellFlags } from '$lib/spellcheck/protocol';
import { replaceWord } from '$lib/spellcheck/tokenize';
import { issueReplacement, Sheet } from '$lib/workbook/sheet.svelte';

/** A French sheet with the flags a check of these rows would give. */
function checkedSheet(rows: string[][], flags: CellFlags[]): Sheet {
    const sheet = new Sheet('Produits');
    sheet.rows = rows;
    sheet.phase = {
        kind: 'confirming',
        guess: {
            detected: 'fr',
            prefill: 'fr',
            confidence: 1,
            confident: true,
            source: 'franc'
        }
    };
    sheet.confirmLanguages(rows[0].map(() => 'fr'));
    sheet.beginCheck();
    sheet.applySheetFlags(flags);
    return sheet;
}

function products(): Sheet {
    return checkedSheet(
        [
            ['Description', 'Note'],
            ['Trés résistant, trés doux', 'Trésor caché'],
            ['Idéal pour macher', 'trés bien']
        ],
        [
            {
                row: 1,
                column: 0,
                text: 'Trés résistant, trés doux',
                ranges: [
                    { start: 0, end: 4, suggestions: ['Très', 'Prés'] },
                    { start: 16, end: 20, suggestions: ['très'] }
                ]
            },
            {
                row: 2,
                column: 0,
                text: 'Idéal pour macher',
                ranges: [{ start: 11, end: 17, suggestions: ['mâcher'] }]
            },
            {
                row: 2,
                column: 1,
                text: 'trés bien',
                ranges: [{ start: 0, end: 4, suggestions: ['très'] }]
            }
        ]
    );
}

describe('Sheet.fixWord', () => {
    it('rewrites every flagged occurrence across the sheet, keeping case', () => {
        const sheet = products();

        const edits = sheet.fixWord('Trés');

        expect(edits).toHaveLength(2);
        expect(sheet.cellValue(1, 0)).toBe('Très résistant, très doux');
        expect(sheet.cellValue(2, 1)).toBe('très bien');
        // Whole words only: a longer word containing it is untouched.
        expect(sheet.cellValue(1, 1)).toBe('Trésor caché');
        expect(sheet.cellValue(2, 0)).toBe('Idéal pour macher');
        expect(sheet.flaggedWords().map(({ key }) => key)).toEqual(['macher']);
        expect(sheet.issueCount).toBe(1);
    });

    it('marks every affected cell as edited', () => {
        const sheet = products();
        sheet.fixWord('trés');
        expect(sheet.isEdited(1, 0)).toBe(true);
        expect(sheet.isEdited(2, 1)).toBe(true);
        expect(sheet.isEdited(2, 0)).toBe(false);
    });

    it('undoes and redoes the whole fix in one step', () => {
        const sheet = products();
        sheet.editCell(1, 1, 'Trésor bien caché');
        sheet.fixWord('trés');

        const undone = sheet.undo();
        expect(undone).toHaveLength(2);
        expect(sheet.cellValue(1, 0)).toBe('Trés résistant, trés doux');
        expect(sheet.cellValue(2, 1)).toBe('trés bien');
        // The earlier manual edit is its own step, still in place.
        expect(sheet.cellValue(1, 1)).toBe('Trésor bien caché');
        // Undo restores the text, never the edited state.
        expect(sheet.isEdited(2, 1)).toBe(true);

        expect(sheet.redo()).toHaveLength(2);
        expect(sheet.cellValue(1, 0)).toBe('Très résistant, très doux');
        expect(sheet.cellValue(2, 1)).toBe('très bien');
    });

    it('keeps a cell’s other flags on their words after a length change', () => {
        const sheet = checkedSheet(
            [['Note'], ['facil et Trés']],
            [
                {
                    row: 1,
                    column: 0,
                    text: 'facil et Trés',
                    ranges: [
                        { start: 0, end: 5, suggestions: ['facile'] },
                        { start: 9, end: 13, suggestions: ['Très'] }
                    ]
                }
            ]
        );

        sheet.fixWord('facil');

        expect(sheet.cellValue(1, 0)).toBe('facile et Trés');
        expect(sheet.flagRanges(1, 0)).toEqual([
            { start: 10, end: 14, suggestions: ['Très'] }
        ]);
        expect(sheet.cellIssues(1, 0)).toEqual([
            {
                key: 'trés',
                word: 'Trés',
                suggestion: 'Très',
                replacements: { Trés: 'Très' }
            }
        ]);
    });

    it('fixes a spelling with no suggestion of its own from another, keeping its case', () => {
        const sheet = checkedSheet(
            [['Note'], ['Trés bien'], ['trés doux']],
            [
                {
                    row: 1,
                    column: 0,
                    text: 'Trés bien',
                    ranges: [{ start: 0, end: 4, suggestions: ['Très'] }]
                },
                {
                    row: 2,
                    column: 0,
                    text: 'trés doux',
                    ranges: [{ start: 0, end: 4, suggestions: [] }]
                }
            ]
        );

        expect(sheet.fixWord('Trés')).toHaveLength(2);
        expect(sheet.cellValue(1, 0)).toBe('Très bien');
        expect(sheet.cellValue(2, 0)).toBe('très doux');
    });

    it('changes nothing, and records no undo step, without a suggestion', () => {
        const sheet = checkedSheet(
            [['Note'], ['xyzzq']],
            [
                {
                    row: 1,
                    column: 0,
                    text: 'xyzzq',
                    ranges: [{ start: 0, end: 5, suggestions: [] }]
                }
            ]
        );

        expect(sheet.fixWord('xyzzq')).toEqual([]);
        expect(sheet.cellValue(1, 0)).toBe('xyzzq');
        expect(sheet.history.canUndo).toBe(false);
    });

    it('groups capitalisations into one cell issue, each with its own fix', () => {
        const sheet = products();
        const [trés] = sheet.cellIssues(1, 0);
        expect(trés).toEqual({
            key: 'trés',
            word: 'Trés',
            suggestion: 'Très',
            replacements: { Trés: 'Très', trés: 'très' }
        });

        // The editor's Fix, applied to a draft that still holds both.
        expect(
            replaceWord('Trés résistant, trés doux', trés.key, (word) =>
                issueReplacement(trés, word)
            )
        ).toBe('Très résistant, très doux');
        // A spelling typed after the check still gets its case matched.
        expect(issueReplacement(trés, 'trés')).toBe('très');
        expect(
            issueReplacement(
                { ...trés, replacements: { Trés: 'Très' } },
                'trés'
            )
        ).toBe('très');
    });

    it('skips a cell whose text changed since it was checked', () => {
        const sheet = products();
        sheet.editCell(2, 1, 'trés très bien');

        const edits = sheet.fixWord('trés');

        expect(edits.map(({ row, column }) => [row, column])).toEqual([[1, 0]]);
        expect(sheet.cellValue(2, 1)).toBe('trés très bien');
    });
});

describe('Sheet.fixTargets', () => {
    /** Two cells with the same flagged word; the second is mixed-language. */
    function mixedSheet(): Sheet {
        const sheet = checkedSheet(
            [
                ['Beschreibung'],
                ['Sehr chłonna Windel'],
                ['Bardzo chłonna wkładka']
            ],
            [
                {
                    row: 1,
                    column: 0,
                    text: 'Sehr chłonna Windel',
                    ranges: [{ start: 5, end: 12, suggestions: ['chanson'] }]
                },
                {
                    row: 2,
                    column: 0,
                    text: 'Bardzo chłonna wkładka',
                    ranges: [{ start: 7, end: 14, suggestions: ['chanson'] }]
                }
            ]
        );
        sheet.applySheetFlags(
            [
                {
                    row: 1,
                    column: 0,
                    text: 'Sehr chłonna Windel',
                    ranges: [{ start: 5, end: 12, suggestions: ['chanson'] }]
                },
                {
                    row: 2,
                    column: 0,
                    text: 'Bardzo chłonna wkładka',
                    ranges: [{ start: 7, end: 14, suggestions: ['chanson'] }]
                }
            ],
            [
                {
                    row: 2,
                    column: 0,
                    counts: [
                        ['pl', 2],
                        ['fr', 1]
                    ]
                }
            ]
        );
        return sheet;
    }

    it('lists every cell a fix would touch, marking the mixed ones', () => {
        const targets = mixedSheet().fixTargets('chłonna');

        expect(targets).toEqual([
            {
                row: 1,
                column: 0,
                text: 'Sehr chłonna Windel',
                languages: ['fr'],
                mixed: false
            },
            {
                row: 2,
                column: 0,
                text: 'Bardzo chłonna wkładka',
                languages: ['pl', 'fr'],
                mixed: true
            }
        ]);
    });

    it('rewrites only the cells it is given', () => {
        const sheet = mixedSheet();

        const edits = sheet.fixWord('chłonna', [{ row: 1, column: 0 }]);

        expect(edits).toHaveLength(1);
        expect(sheet.cellValue(1, 0)).toBe('Sehr chanson Windel');
        // The mixed cell is left exactly as it was.
        expect(sheet.cellValue(2, 0)).toBe('Bardzo chłonna wkładka');
        expect(sheet.fixTargets('chłonna')).toHaveLength(1);
    });

    it('still rewrites everything when no cells are given', () => {
        const sheet = mixedSheet();
        expect(sheet.fixWord('chłonna')).toHaveLength(2);
        expect(sheet.cellValue(2, 0)).toBe('Bardzo chanson wkładka');
    });
});
