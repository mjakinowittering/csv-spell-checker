import { describe, expect, it } from 'vitest';

import { csvFileName } from '$lib/csv/download';
import { parseDelimited } from '$lib/csv/parse';
import { serializeCsv } from '$lib/csv/serialize';

const roundTrip = (rows: string[][]) =>
    parseDelimited(serializeCsv(rows), { delimiter: ',' });

describe('serializeCsv', () => {
    it('writes plain fields unquoted with CRLF line endings', () => {
        expect(
            serializeCsv([
                ['Name', 'City'],
                ['Ada', 'London']
            ])
        ).toBe('Name,City\r\nAda,London\r\n');
    });

    it('quotes fields with commas, quotes, line breaks or edge whitespace', () => {
        expect(
            serializeCsv([
                ['a,b', 'say "hi"', 'line 1\nline 2', ' padded ', 'ok']
            ])
        ).toBe('"a,b","say ""hi""","line 1\nline 2"," padded ",ok\r\n');
    });

    it('keeps empty fields', () => {
        expect(serializeCsv([['', 'x', '']])).toBe(',x,\r\n');
    });
});

describe('parse → serialise round trip', () => {
    it.each([
        [
            'quotes, commas and line breaks',
            [
                ['Name', 'Bio'],
                ['Sarah', 'Loves "hiking", coffee\r\nand mail'],
                ['Tom', 'Line one\nline two']
            ]
        ],
        [
            'accents and non-Latin letters',
            [
                ['Produit', 'Straße'],
                ['Chaise abîmée', 'niños ñ']
            ]
        ],
        [
            'empty cells and an empty row between data rows',
            [
                ['a', 'b', 'c'],
                ['', '', ''],
                ['d', '', 'f']
            ]
        ],
        ['leading and trailing spaces', [[' left', 'right ', '  both  ']]]
    ])('preserves %s', (_, rows) => {
        expect(roundTrip(rows)).toEqual(rows);
    });

    it('reproduces a parsed file cell for cell after editing', () => {
        const original =
            'First Name,Notes\r\n"Blake, Tom","He said ""hello"""\r\nPriya,\r\n';
        const rows = parseDelimited(original, { delimiter: ',' });
        rows[2][1] = 'Receives mail';
        expect(roundTrip(rows)).toEqual([
            ['First Name', 'Notes'],
            ['Blake, Tom', 'He said "hello"'],
            ['Priya', 'Receives mail']
        ]);
    });
});

describe('csvFileName', () => {
    it('names the file after the sheet', () => {
        expect(csvFileName('Sheet 1')).toBe('Sheet 1.csv');
        expect(csvFileName('people.csv')).toBe('people.csv');
    });

    it('replaces characters file systems reject', () => {
        expect(csvFileName('Pasted sheet 14:02:31')).toBe(
            'Pasted sheet 14-02-31.csv'
        );
        expect(csvFileName('a/b\\c')).toBe('a-b-c.csv');
    });

    it('falls back when nothing is left', () => {
        expect(csvFileName('  ')).toBe('sheet.csv');
    });
});
