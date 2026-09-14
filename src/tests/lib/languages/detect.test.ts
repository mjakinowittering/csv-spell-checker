import { describe, expect, it } from 'vitest';

import {
    detectLanguage,
    englishVariantFor,
    sampleText
} from '$lib/languages/detect';

const sheet = (lines: string[][]) => [['Header A', 'Header B'], ...lines];

const long = {
    en: 'Comfortable oak chair with arms. Delivery expected by Friday. The customer asked for a refund because the table arrived damaged.',
    fr: 'Chaise en chêne confortable avec accoudoirs. Livraison prévue vendredi. Le client a demandé un remboursement car la table est arrivée abîmée.',
    de: 'Bequemer Eichenstuhl mit Armlehnen. Lieferung am Freitag erwartet. Der Kunde bat um Rückerstattung, weil der Tisch beschädigt ankam.',
    es: 'Silla de roble cómoda con reposabrazos. Entrega prevista el viernes. El cliente pidió un reembolso porque la mesa llegó dañada.',
    it: 'Sedia in rovere comoda con braccioli. Consegna prevista venerdì. Il cliente ha chiesto un rimborso perché il tavolo è arrivato danneggiato.'
};

describe('sampleText', () => {
    it('takes the first 10 rows after the header, all columns combined', () => {
        const rows = [
            ['skip', 'header'],
            ...Array.from({ length: 15 }, (_, i) => [`a${i}`, `b${i}`])
        ];
        const text = sampleText(rows);
        expect(text).not.toContain('header');
        expect(text).toContain('a0 b0');
        expect(text).toContain('a9 b9');
        expect(text).not.toContain('a10');
    });
});

describe('detectLanguage', () => {
    it.each([
        ['fr', long.fr],
        ['de', long.de],
        ['es', long.es],
        ['it', long.it]
    ] as const)('confidently detects %s', (language, text) => {
        const [first, second] = [text.slice(0, 70), text.slice(70)];
        expect(detectLanguage(sheet([[first, second]]), 'en-GB')).toEqual({
            language,
            confident: true
        });
    });

    it('maps English to the preferred variant', () => {
        const rows = sheet([[long.en, '']]);
        expect(detectLanguage(rows, 'en-US').language).toBe('en-US');
        expect(detectLanguage(rows, 'en-GB').language).toBe('en-GB');
    });

    it('marks short samples as low confidence', () => {
        expect(
            detectLanguage(
                sheet([
                    ['Oak chair', 'Blue'],
                    ['12', 'Table']
                ]),
                'en-GB'
            ).confident
        ).toBe(false);
    });

    it('falls back to English, low confidence, when there is no text', () => {
        expect(detectLanguage(sheet([['12', '34']]), 'en-GB')).toEqual({
            language: 'en-GB',
            confident: false
        });
    });
});

describe('englishVariantFor', () => {
    it('picks US only for an en-US preference, otherwise UK', () => {
        expect(englishVariantFor(['en-US', 'fr'])).toBe('en-US');
        expect(englishVariantFor(['fr-FR', 'en-GB'])).toBe('en-GB');
        expect(englishVariantFor(['de-DE'])).toBe('en-GB');
        expect(englishVariantFor(['en'])).toBe('en-GB');
    });
});
