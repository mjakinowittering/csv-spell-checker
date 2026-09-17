import { createHunspellFromStrings } from 'hunspell-wasm';

import { isLanguageCode, type LanguageCode } from '$lib/languages/codes';

import { resolveFallbacks } from './fallback';
import type {
    CellFlags,
    CellLanguages,
    SpellcheckRequest,
    SpellcheckResponse,
    WordFlag
} from './protocol';
import { suggestionsFor } from './suggestions';
import {
    ignoreKey,
    isSpelledCorrectly,
    tokenize,
    type WordCheck
} from './tokenize';

const PROGRESS_EVERY = 500;

/** One loaded dictionary: spelling checks and suggestions, both memoised. */
type Checker = {
    check: WordCheck;
    suggest: (word: string) => string[];
};

/** A cell's words, split by whether its own language accepted them. */
type CellScan = {
    row: number;
    column: number;
    text: string;
    language: LanguageCode;
    checker: Checker;
    /** How many words the cell's own language accepted. */
    matched: number;
    /** The words it rejected, with where they sit in the text. */
    failures: { word: string; start: number; end: number }[];
};

let dictionaryBase = '';
const checkers = new Map<LanguageCode, Promise<Checker>>();

function post(response: SpellcheckResponse) {
    self.postMessage(response);
}

async function fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    return response.text();
}

/**
 * Load a dictionary once per worker — including fallbacks, so one loaded for
 * an earlier sheet is reused — and memoise every word looked up in it.
 */
function loadChecker(language: LanguageCode): Promise<Checker> {
    const existing = checkers.get(language);
    if (existing) return existing;

    const checker = (async (): Promise<Checker> => {
        const url = (file: string) => `${dictionaryBase}${language}/${file}`;
        const [aff, dic] = await Promise.all([
            fetchText(url('index.aff')),
            fetchText(url('index.dic'))
        ]);
        // Hunspell compiled to WebAssembly: loads even the largest dictionaries
        // (Italian, Polish, Czech) in well under a second.
        const hunspell = await createHunspellFromStrings(aff, dic);
        const correct = new Map<string, boolean>();
        // Suggestions are far slower than checks, and a sheet repeats the same
        // misspellings, so each word is only ever looked up once.
        const suggestions = new Map<string, string[]>();
        return {
            check: (word) => {
                let result = correct.get(word);
                if (result === undefined) {
                    result = hunspell.testSpelling(word);
                    correct.set(word, result);
                }
                return result;
            },
            suggest: (word) => {
                let result = suggestions.get(word);
                if (result === undefined) {
                    result = suggestionsFor(word, (lookup) =>
                        hunspell.getSpellingSuggestions(lookup)
                    );
                    suggestions.set(word, result);
                }
                return result;
            }
        };
    })();

    checkers.set(language, checker);
    // A failed load can be retried by a later request.
    checker.catch(() => checkers.delete(language));
    return checker;
}

async function checkersFor(
    sheetId: string,
    languages: readonly string[]
): Promise<Map<LanguageCode, Checker>> {
    const needed = [...new Set(languages.filter(isLanguageCode))];
    const loaded = await Promise.allSettled(needed.map(loadChecker));
    const result = new Map<LanguageCode, Checker>();
    loaded.forEach((outcome, index) => {
        const language = needed[index];
        if (outcome.status === 'fulfilled') {
            result.set(language, outcome.value);
        } else {
            console.error(
                'Dictionary failed to load',
                language,
                outcome.reason
            );
            post({ type: 'dictionary-error', sheetId, language });
        }
    });
    return result;
}

/**
 * A fallback dictionary, loaded the first time a word needs it. A fallback
 * that cannot load is skipped rather than reported: the user never chose it,
 * and the word simply carries on down the chain.
 */
async function fallbackChecker(
    language: LanguageCode
): Promise<WordCheck | null> {
    try {
        return (await loadChecker(language)).check;
    } catch (error) {
        console.error('Fallback dictionary failed to load', language, error);
        return null;
    }
}

/** Split one cell's words by whether its own language accepts them. */
function scanCell(
    row: number,
    column: number,
    text: string,
    language: LanguageCode,
    checker: Checker,
    ignored: ReadonlySet<string>
): CellScan {
    const scan: CellScan = {
        row,
        column,
        text,
        language,
        checker,
        matched: 0,
        failures: []
    };
    for (const { word, start, end } of tokenize(text)) {
        if (ignored.has(ignoreKey(word))) continue;
        if (isSpelledCorrectly(word, checker.check)) scan.matched += 1;
        else scan.failures.push({ word, start, end });
    }
    return scan;
}

/**
 * For each primary language, which fallback language (if any) accepts each
 * word it rejected. Grouped by language so a fallback dictionary is loaded
 * once for the whole sheet, and only when some word still needs it.
 */
async function resolveScans(
    scans: readonly CellScan[]
): Promise<Map<LanguageCode, Map<string, LanguageCode | null>>> {
    const failures = new Map<LanguageCode, Set<string>>();
    for (const scan of scans) {
        if (scan.failures.length === 0) continue;
        const words = failures.get(scan.language) ?? new Set<string>();
        for (const failure of scan.failures) words.add(failure.word);
        failures.set(scan.language, words);
    }

    const resolutions = new Map<
        LanguageCode,
        Map<string, LanguageCode | null>
    >();
    for (const [language, words] of failures) {
        resolutions.set(
            language,
            await resolveFallbacks(words, language, fallbackChecker)
        );
    }
    return resolutions;
}

/** A cell's flags and language counts, once its failures are resolved. */
function cellOutcome(
    scan: CellScan,
    resolved: Map<string, LanguageCode | null> | undefined
): { flags: CellFlags | null; languages: CellLanguages | null } {
    const counts = new Map<LanguageCode, number>();
    if (scan.matched > 0) counts.set(scan.language, scan.matched);
    const ranges: WordFlag[] = [];

    for (const { word, start, end } of scan.failures) {
        const matched = resolved?.get(word) ?? null;
        if (matched) {
            counts.set(matched, (counts.get(matched) ?? 0) + 1);
            continue;
        }
        ranges.push({
            start,
            end,
            // Hunspell expects straight apostrophes, as the check does.
            suggestions: scan.checker.suggest(word.replace(/’/g, "'"))
        });
    }

    const { row, column, text } = scan;
    return {
        flags: ranges.length > 0 ? { row, column, text, ranges } : null,
        // Only worth sending when more than the cell's own language matched.
        languages:
            counts.size > 1
                ? {
                      row,
                      column,
                      counts: [...counts].sort((a, b) => b[1] - a[1])
                  }
                : null
    };
}

async function checkSheet(
    request: Extract<SpellcheckRequest, { type: 'check-sheet' }>
) {
    const { sheetId, rows, languages } = request;
    const ignored = new Set(request.ignoredWords);
    const checks = await checkersFor(sheetId, languages);
    const total = rows.reduce((sum, row) => sum + row.length, 0);
    const scans: CellScan[] = [];
    let visited = 0;

    rows.forEach((row, rowIndex) => {
        row.forEach((text, column) => {
            visited += 1;
            if (visited % PROGRESS_EVERY === 0) {
                post({
                    type: 'sheet-progress',
                    sheetId,
                    fraction: visited / total
                });
            }
            const language = languages[column];
            const checker =
                language && isLanguageCode(language)
                    ? checks.get(language)
                    : undefined;
            if (!checker || !isLanguageCode(language) || text === '') return;
            const scan = scanCell(
                rowIndex,
                column,
                text,
                language,
                checker,
                ignored
            );
            if (scan.matched > 0 || scan.failures.length > 0) scans.push(scan);
        });
    });

    const resolutions = await resolveScans(scans);
    const flags: CellFlags[] = [];
    const cellLanguages: CellLanguages[] = [];
    for (const scan of scans) {
        const outcome = cellOutcome(scan, resolutions.get(scan.language));
        if (outcome.flags) flags.push(outcome.flags);
        if (outcome.languages) cellLanguages.push(outcome.languages);
    }

    post({ type: 'sheet-result', sheetId, flags, languages: cellLanguages });
}

async function checkCell(
    request: Extract<SpellcheckRequest, { type: 'check-cell' }>
) {
    const { sheetId, row, column, text, language } = request;
    let ranges: WordFlag[] = [];
    let counts: [LanguageCode, number][] = [];

    if (isLanguageCode(language) && text !== '') {
        const checker = (await checkersFor(sheetId, [language])).get(language);
        if (checker) {
            const scan = scanCell(
                row,
                column,
                text,
                language,
                checker,
                new Set(request.ignoredWords)
            );
            const resolved = await resolveFallbacks(
                scan.failures.map((failure) => failure.word),
                language,
                fallbackChecker
            );
            const outcome = cellOutcome(scan, resolved);
            ranges = outcome.flags?.ranges ?? [];
            counts = outcome.languages?.counts ?? [];
        }
    }

    post({
        type: 'cell-result',
        sheetId,
        cell: { row, column, text, ranges },
        languages: counts
    });
}

self.onmessage = ({ data }: MessageEvent<SpellcheckRequest>) => {
    switch (data.type) {
        case 'init':
            dictionaryBase = data.dictionaryBase;
            break;
        case 'check-sheet':
            checkSheet(data).catch((error) =>
                console.error('Sheet check failed', error)
            );
            break;
        case 'check-cell':
            checkCell(data).catch((error) =>
                console.error('Cell check failed', error)
            );
            break;
    }
};
