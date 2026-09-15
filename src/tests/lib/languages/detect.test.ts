import { describe, expect, it, vi } from 'vitest';

import type { BuiltInDetectorFactory } from '$lib/languages/chrome-detector';
import {
    detectSheetLanguage,
    englishVariantFor,
    guessFromRanking,
    sampleText,
    toSupportedLanguage
} from '$lib/languages/detect';
import { detectWithFranc } from '$lib/languages/franc-detector';

const sheet = (lines: string[][]) => [['Header A', 'Header B'], ...lines];

const long = {
    en: 'Comfortable oak chair with arms. Delivery expected by Friday. The customer asked for a refund because the table arrived damaged.',
    fr: 'Chaise en chêne confortable avec accoudoirs. Livraison prévue vendredi. Le client a demandé un remboursement car la table est arrivée abîmée.',
    de: 'Bequemer Eichenstuhl mit Armlehnen. Lieferung am Freitag erwartet. Der Kunde bat um Rückerstattung, weil der Tisch beschädigt ankam.',
    es: 'Silla de roble cómoda con reposabrazos. Entrega prevista el viernes. El cliente pidió un reembolso porque la mesa llegó dañada.',
    pl: 'Wygodne dębowe krzesło z podłokietnikami. Dostawa przewidziana na piątek. Klient poprosił o zwrot pieniędzy, ponieważ stół dotarł uszkodzony.'
};

// Forces the Franc path: headless Chromium and Node have no built-in detector.
const franc = { locales: ['en-GB'], builtIn: null };

/** A stand-in for Chrome's detector returning fixed results. */
function builtInReturning(
    detections: { detectedLanguage: string; confidence: number }[],
    availability: 'available' | 'unavailable' = 'available'
): BuiltInDetectorFactory {
    return {
        availability: async () => availability,
        create: async () => ({ detect: async () => detections })
    };
}

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

describe('Franc fallback', () => {
    it.each([
        ['fr', long.fr],
        ['de', long.de],
        ['es', long.es]
    ] as const)(
        'confidently detects and pre-fills %s',
        async (language, text) => {
            const guess = await detectSheetLanguage(sheet([[text, '']]), franc);
            expect(guess).toMatchObject({
                detected: language,
                prefill: language,
                confident: true,
                source: 'franc'
            });
        }
    );

    it('derives confidence from the gap between the top two scores, not the top score', async () => {
        const { ranked, gap } = await detectWithFranc(long.fr);
        // Franc always normalises the best score to 1.
        expect(ranked[0].confidence).toBe(1);
        expect(gap).toBeCloseTo(1 - ranked[1].confidence);
        expect(gap).toBeLessThan(1);
    });

    it('pre-fills nothing for a short, unreliable sample', async () => {
        const guess = await detectSheetLanguage(
            sheet([
                ['Oak chair', 'Blue'],
                ['12', 'Table']
            ]),
            franc
        );
        expect(guess.confident).toBe(false);
        expect(guess.prefill).toBeNull();
    });

    it('marks a confidently detected unsupported language as unsupported', async () => {
        const guess = await detectSheetLanguage(sheet([[long.pl, '']]), franc);
        expect(guess).toMatchObject({
            detected: 'pl',
            prefill: 'unsupported',
            confident: true
        });
    });

    it('pre-fills nothing when there is no text at all', async () => {
        const guess = await detectSheetLanguage(sheet([['12', '34']]), franc);
        expect(guess.prefill).toBeNull();
        expect(guess.confident).toBe(false);
    });
});

describe('built-in detector', () => {
    it('is preferred when available, using its own confidence', async () => {
        const guess = await detectSheetLanguage(sheet([[long.es, '']]), {
            locales: ['en-GB'],
            builtIn: builtInReturning([
                { detectedLanguage: 'es', confidence: 0.93 },
                { detectedLanguage: 'pt', confidence: 0.04 }
            ])
        });
        expect(guess).toEqual({
            detected: 'es',
            prefill: 'es',
            confidence: 0.93,
            confident: true,
            source: 'built-in'
        });
    });

    it('pre-fills nothing below the confidence threshold', async () => {
        const guess = await detectSheetLanguage(sheet([[long.es, '']]), {
            locales: ['en-GB'],
            builtIn: builtInReturning([
                { detectedLanguage: 'es', confidence: 0.41 },
                { detectedLanguage: 'pt', confidence: 0.38 }
            ])
        });
        expect(guess.prefill).toBeNull();
        expect(guess.source).toBe('built-in');
    });

    it('falls back to Franc when the model is unavailable', async () => {
        const guess = await detectSheetLanguage(sheet([[long.de, '']]), {
            locales: ['en-GB'],
            builtIn: builtInReturning([], 'unavailable')
        });
        expect(guess).toMatchObject({ prefill: 'de', source: 'franc' });
    });

    it('falls back to Franc when detection throws', async () => {
        const failing: BuiltInDetectorFactory = {
            availability: async () => 'available',
            create: async () => {
                throw new Error('model download failed');
            }
        };
        const guess = await detectSheetLanguage(sheet([[long.de, '']]), {
            locales: ['en-GB'],
            builtIn: failing
        });
        expect(guess).toMatchObject({ prefill: 'de', source: 'franc' });
    });

    it('falls back quietly when the device has no model', async () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const noModel: BuiltInDetectorFactory = {
            availability: async () => 'downloadable',
            create: async () => {
                throw new DOMException('Model not available', 'NotSupportedError');
            }
        };
        const guess = await detectSheetLanguage(sheet([[long.de, '']]), {
            locales: ['en-GB'],
            builtIn: noModel
        });
        expect(guess).toMatchObject({ prefill: 'de', source: 'franc' });
        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });
});

describe('guessFromRanking', () => {
    it('maps English to the preferred variant', () => {
        const ranked = [{ language: 'en', confidence: 0.9 }];
        expect(
            guessFromRanking(ranked, 0.9, true, 'built-in', ['en-US']).prefill
        ).toBe('en-US');
        expect(
            guessFromRanking(ranked, 0.9, true, 'built-in', ['fr-FR']).prefill
        ).toBe('en-GB');
    });

    it('keeps the detected code even when not confident', () => {
        expect(
            guessFromRanking(
                [{ language: 'fr', confidence: 0.2 }],
                0.2,
                false,
                'built-in',
                []
            )
        ).toMatchObject({ detected: 'fr', prefill: null });
    });
});

describe('toSupportedLanguage', () => {
    it('accepts regional codes by their base language', () => {
        expect(toSupportedLanguage('fr-CA', [])).toBe('fr');
        expect(toSupportedLanguage('pl', [])).toBeNull();
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
