import { francAll } from 'franc';

import type { LanguageCode } from './codes';

// Kept free of UI imports: this runs inside the parse worker.

/** Rows sampled for detection, after the header row. */
export const SAMPLE_ROW_COUNT = 10;

// Franc scores are relative: the best match is always 1. A guess is only
// trusted when there was enough text to judge and the runner-up is not close.
// Measured: short samples (under ~100 letters) are often confidently wrong,
// and genuinely mixed text scores within a few hundredths.
const MIN_LETTERS = 100;
const MIN_MARGIN = 0.04;

const FRANC_CODES = {
    eng: 'en',
    fra: 'fr',
    deu: 'de',
    spa: 'es'
} as const;

// Still offered to Franc so text in these languages is never confidently
// pre-filled as its closest supported neighbour (Italian reads as Spanish).
const UNSUPPORTED_CANDIDATES = ['ita'];

type FrancCode = keyof typeof FRANC_CODES;
type EnglishVariant = Extract<LanguageCode, 'en-GB' | 'en-US'>;

export type LanguageGuess = {
    language: LanguageCode;
    confident: boolean;
};

function isFrancCode(code: string): code is FrancCode {
    return code in FRANC_CODES;
}

/** The first 10 non-header rows, every column combined. */
export function sampleText(rows: readonly (readonly string[])[]): string {
    return rows
        .slice(1, 1 + SAMPLE_ROW_COUNT)
        .map((row) => row.join(' '))
        .join('\n');
}

/**
 * Franc cannot tell British from American English, so English guesses use the
 * variant matching the browser's preferred English locale (UK by default).
 */
export function englishVariantFor(locales: readonly string[]): EnglishVariant {
    const english = locales.find((locale) => /^en\b/i.test(locale));
    return english?.toLowerCase() === 'en-us' ? 'en-US' : 'en-GB';
}

/** One sheet-wide guess, used to pre-fill every column's language. */
export function detectLanguage(
    rows: readonly (readonly string[])[],
    englishVariant: EnglishVariant
): LanguageGuess {
    const text = sampleText(rows);
    const letters = text.match(/\p{L}/gu)?.length ?? 0;
    const ranked = francAll(text, {
        only: [...Object.keys(FRANC_CODES), ...UNSUPPORTED_CANDIDATES],
        minLength: 10
    });
    const [top, runnerUp] = ranked;
    const best = ranked.find((entry): entry is [FrancCode, number] =>
        isFrancCode(entry[0])
    );

    if (!top || !best) {
        return { language: englishVariant, confident: false };
    }

    const base = FRANC_CODES[best[0]];
    const language = base === 'en' ? englishVariant : base;
    const margin = runnerUp ? top[1] - runnerUp[1] : 1;

    return {
        language,
        confident:
            isFrancCode(top[0]) &&
            letters >= MIN_LETTERS &&
            margin >= MIN_MARGIN
    };
}
