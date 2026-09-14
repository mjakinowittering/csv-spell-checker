import { describe, expect, it } from 'vitest';

import { detectDelimiter, parseDelimited } from '$lib/csv/parse';

const csv = (text: string) => parseDelimited(text, { delimiter: ',' });

describe('parseDelimited', () => {
    it('splits rows and fields', () => {
        expect(csv('a,b\nc,d')).toEqual([
            ['a', 'b'],
            ['c', 'd']
        ]);
    });

    it('accepts CRLF, LF and CR line endings', () => {
        expect(csv('a\r\nb\nc\rd')).toEqual([['a'], ['b'], ['c'], ['d']]);
    });

    it('keeps delimiters, doubled quotes and line breaks inside quoted fields', () => {
        expect(csv('"a,b","say ""hi""","line 1\r\nline 2"')).toEqual([
            ['a,b', 'say "hi"', 'line 1\r\nline 2']
        ]);
    });

    it('keeps empty fields, including quoted empty fields', () => {
        expect(csv(',"",x,')).toEqual([['', '', 'x', '']]);
    });

    it('drops a leading BOM', () => {
        expect(csv('﻿name,city')).toEqual([['name', 'city']]);
    });

    it('drops trailing empty lines but keeps empty rows in the middle', () => {
        expect(csv('a\n\nb\n\n\n')).toEqual([['a'], [''], ['b']]);
    });

    it('pads ragged rows to the widest row', () => {
        expect(csv('a,b,c\nd\ne,f')).toEqual([
            ['a', 'b', 'c'],
            ['d', '', ''],
            ['e', 'f', '']
        ]);
    });

    it('returns no rows for empty input', () => {
        expect(csv('')).toEqual([]);
        expect(csv('\n\r\n')).toEqual([]);
    });

    it('parses tab separated pasted cells', () => {
        expect(
            parseDelimited('Name\tNote\nAda\t"multi\nline"', {
                delimiter: '\t'
            })
        ).toEqual([
            ['Name', 'Note'],
            ['Ada', 'multi\nline']
        ]);
    });

    it('reports progress ending at 1', () => {
        const fractions: number[] = [];
        parseDelimited('x,'.repeat(100_000), {
            delimiter: ',',
            onProgress: (fraction) => fractions.push(fraction)
        });
        expect(fractions.length).toBeGreaterThan(1);
        expect(fractions.at(-1)).toBe(1);
        expect(fractions).toEqual([...fractions].sort((a, b) => a - b));
    });
});

describe('detectDelimiter', () => {
    it('detects comma, semicolon and tab from the first line', () => {
        expect(detectDelimiter('a,b,c\n1;2;3;4;5')).toBe(',');
        expect(detectDelimiter('a;b;c\n1,2')).toBe(';');
        expect(detectDelimiter('a\tb\tc')).toBe('\t');
    });

    it('ignores delimiters inside quotes', () => {
        expect(detectDelimiter('"a;b;c;d",e,f')).toBe(',');
    });

    it('defaults to comma', () => {
        expect(detectDelimiter('single column')).toBe(',');
    });
});
