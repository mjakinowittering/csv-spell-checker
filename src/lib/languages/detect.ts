import {
    builtInDetector,
    detectWithBuiltIn,
    type BuiltInDetectorFactory
} from './chrome-detector';
import type { LanguageCode } from './codes';
import { detectWithFranc } from './franc-detector';

// Runs on the main thread during the upload/paste loading step, after parsing
// and before the grid or spellcheck worker start.

/** Rows sampled for detection, after the header row. */
export const SAMPLE_ROW_COUNT = 10;

/** Built-in detector: its confidence score must reach this to pre-fill. */
export const BUILT_IN_MIN_CONFIDENCE = 0.7;

// Franc: short samples (under ~100 letters) are often confidently wrong, and
// genuinely ambiguous text leaves the top two scores within a few hundredths.
export const FRANC_MIN_LETTERS = 100;
export const FRANC_MIN_GAP = 0.04;

export type DetectionSource = 'built-in' | 'franc';

/** A detected language (BCP 47) with a score from the detector that found it. */
export type RankedLanguage = { language: string; confidence: number };

export type LanguageGuess = {
    /** The most likely language as a BCP 47 code, or null if none was found. */
    detected: string | null;
    /**
     * What the confirmation screen pre-selects: a supported language,
     * `unsupported` when the detected language cannot be checked, or null when
     * the guess is not reliable enough to pre-fill anything.
     */
    prefill: LanguageCode | 'unsupported' | null;
    /** 0–1: the built-in detector's score, or Franc's top-two gap. */
    confidence: number;
    confident: boolean;
    source: DetectionSource;
};

export type DetectOptions = {
    /** Browser locale preferences, for regional variants. */
    locales?: readonly string[];
    /** The built-in detector; null forces Franc. Defaults to the browser's. */
    builtIn?: BuiltInDetectorFactory | null;
};

/** The first 10 non-header rows, every column combined. */
export function sampleText(rows: readonly (readonly string[])[]): string {
    return rows
        .slice(1, 1 + SAMPLE_ROW_COUNT)
        .map((row) => row.join(' '))
        .join('\n');
}

function countLetters(text: string): number {
    return text.match(/\p{L}/gu)?.length ?? 0;
}

/**
 * Detectors cannot tell British from American English, so English uses the
 * variant matching the browser's preferred English locale (UK by default).
 */
export function englishVariantFor(
    locales: readonly string[]
): Extract<LanguageCode, 'en-GB' | 'en-US'> {
    const english = locales.find((locale) => /^en\b/i.test(locale));
    return english?.toLowerCase() === 'en-us' ? 'en-US' : 'en-GB';
}

/** The supported language for a detected BCP 47 code, if there is one. */
export function toSupportedLanguage(
    detected: string,
    locales: readonly string[]
): LanguageCode | null {
    const base = detected.toLowerCase().split('-')[0];
    switch (base) {
        case 'en':
            return englishVariantFor(locales);
        case 'fr':
        case 'de':
        case 'es':
            return base;
        default:
            return null;
    }
}

/** Turn a ranking into a guess, pre-filling only when confident. */
export function guessFromRanking(
    ranked: readonly RankedLanguage[],
    confidence: number,
    confident: boolean,
    source: DetectionSource,
    locales: readonly string[]
): LanguageGuess {
    const best = ranked[0];
    if (!best) {
        return {
            detected: null,
            prefill: null,
            confidence: 0,
            confident: false,
            source
        };
    }
    const supported = toSupportedLanguage(best.language, locales);
    return {
        detected: best.language,
        prefill: confident ? (supported ?? 'unsupported') : null,
        confidence,
        confident,
        source
    };
}

/**
 * One sheet-wide guess from a sample of the sheet. Uses the browser's built-in
 * Language Detector when it has one, and Franc otherwise.
 */
export async function detectSheetLanguage(
    rows: readonly (readonly string[])[],
    options: DetectOptions = {}
): Promise<LanguageGuess> {
    const locales = options.locales ?? navigator.languages;
    const builtIn =
        options.builtIn === undefined ? builtInDetector() : options.builtIn;
    const text = sampleText(rows);
    const letters = countLetters(text);

    if (builtIn && letters > 0) {
        try {
            const ranked = await detectWithBuiltIn(text, builtIn);
            if (ranked && ranked.length > 0) {
                const confidence = ranked[0].confidence;
                return guessFromRanking(
                    ranked,
                    confidence,
                    confidence >= BUILT_IN_MIN_CONFIDENCE,
                    'built-in',
                    locales
                );
            }
        } catch (error) {
            console.error('Built-in language detection failed', error);
        }
    }

    const { ranked, gap } = await detectWithFranc(text);
    return guessFromRanking(
        ranked,
        gap,
        letters >= FRANC_MIN_LETTERS && gap >= FRANC_MIN_GAP,
        'franc',
        locales
    );
}
