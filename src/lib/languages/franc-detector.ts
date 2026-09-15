import type { RankedLanguage } from './detect';

// Franc names languages with ISO 639-3 codes. Candidates are limited to the
// languages spreadsheets here are likely to hold: offering all ~400 makes
// short samples noisy, and an unsupported language must still be recognised
// as itself rather than as its nearest supported neighbour.
const FRANC_TO_BCP47: Record<string, string> = {
    eng: 'en',
    fra: 'fr',
    deu: 'de',
    spa: 'es',
    ita: 'it',
    por: 'pt',
    nld: 'nl',
    pol: 'pl',
    swe: 'sv',
    dan: 'da',
    nob: 'nb',
    nno: 'nn',
    ces: 'cs',
    slk: 'sk',
    slv: 'sl',
    hrv: 'hr',
    srp: 'sr',
    bos: 'bs',
    ron: 'ro',
    hun: 'hu',
    fin: 'fi',
    est: 'et',
    lav: 'lv',
    lit: 'lt',
    ell: 'el',
    tur: 'tr',
    rus: 'ru',
    ukr: 'uk',
    bul: 'bg',
    cat: 'ca',
    eus: 'eu',
    glg: 'gl',
    gle: 'ga',
    isl: 'is'
};

export type FrancDetection = {
    ranked: RankedLanguage[];
    /**
     * Franc normalises its best score to 1 however unsure it is, so that score
     * says nothing. The gap between the best and second-best scores does: a
     * small gap means two languages fit the sample almost equally well.
     */
    gap: number;
};

/** Rank candidate languages with Franc, loading it only when needed. */
export async function detectWithFranc(text: string): Promise<FrancDetection> {
    const { francAll } = await import('franc');
    const scores = francAll(text, {
        only: Object.keys(FRANC_TO_BCP47),
        minLength: 10
    }).filter(([code]) => code !== 'und');

    const ranked = scores.map(([code, score]) => ({
        language: FRANC_TO_BCP47[code] ?? code,
        confidence: score
    }));
    const [best, runnerUp] = scores;
    const gap = best ? best[1] - (runnerUp?.[1] ?? 0) : 0;
    return { ranked, gap };
}
