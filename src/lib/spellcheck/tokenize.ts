// Kept free of UI and worker APIs: shared by the spellcheck worker and tests.

/** A misspelled word's position in a cell's text, as UTF-16 offsets. */
export type MisspellingRange = { start: number; end: number };

export type WordToken = { word: string; start: number; end: number };

/** Returns whether a single word is spelled correctly. */
export type WordCheck = (word: string) => boolean;

// Letters (with combining marks), joined by internal apostrophes or hyphens.
// Digits and underscores are matched too so codes can be recognised and skipped.
const WORD = /[\p{L}\p{M}\p{N}_]+(?:['’-][\p{L}\p{M}\p{N}_]+)*/gu;

// Spans that are never prose. Blanked out with spaces so offsets stay valid.
const NOT_PROSE = [
    /\b(?:https?:\/\/|www\.)\S+/giu,
    /[^\s@]+@[^\s@]+\.[^\s@]+/gu
];

// French and Italian-style elisions: l'homme, qu'il, jusqu'à.
const ELISION = /^(?:[cdjlmnst]|qu|jusqu|lorsqu|puisqu)'(.+)$/iu;

/** The words in a cell that are worth spell-checking, with their offsets. */
export function tokenize(text: string): WordToken[] {
    let masked = text;
    for (const pattern of NOT_PROSE) {
        masked = masked.replace(pattern, (match) => ' '.repeat(match.length));
    }

    const tokens: WordToken[] = [];
    for (const match of masked.matchAll(WORD)) {
        const token = match[0];
        // Anything with a digit or underscore is a code, not prose: SKU-12, v2.
        if (/[\p{N}_]/u.test(token)) continue;

        // Hyphenated compounds are checked part by part.
        let offset = match.index;
        for (const part of token.split('-')) {
            if (isCheckable(part)) {
                tokens.push({
                    word: part,
                    start: offset,
                    end: offset + part.length
                });
            }
            offset += part.length + 1;
        }
    }
    return tokens;
}

/** Ranges of the words in `text` that `check` rejects. */
export function findMisspellings(
    text: string,
    check: WordCheck
): MisspellingRange[] {
    return tokenize(text)
        .filter(({ word }) => !isCorrect(word, check))
        .map(({ start, end }) => ({ start, end }));
}

function isCheckable(word: string): boolean {
    const letters = word.replace(/['’]/g, '');
    // Single letters are initials or list markers.
    if ([...letters].length < 2) return false;
    // All capitals are acronyms: SKU, NASA, UK.
    return letters !== letters.toUpperCase();
}

function isCorrect(word: string, check: WordCheck): boolean {
    const normalised = word.replace(/’/g, "'");
    if (check(normalised)) return true;
    const elided = ELISION.exec(normalised);
    return elided !== null && check(elided[1]);
}
