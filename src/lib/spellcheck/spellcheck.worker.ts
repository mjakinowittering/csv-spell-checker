import { createHunspellFromStrings } from 'hunspell-wasm';

import { isLanguageCode, type LanguageCode } from '$lib/languages/codes';

import type {
    CellFlags,
    SpellcheckRequest,
    SpellcheckResponse
} from './protocol';
import { findMisspellings, type WordCheck } from './tokenize';

const PROGRESS_EVERY = 500;

let dictionaryBase = '';
const checkers = new Map<LanguageCode, Promise<WordCheck>>();

function post(response: SpellcheckResponse) {
    self.postMessage(response);
}

async function fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    return response.text();
}

/** Load a dictionary once per worker; repeated words are memoised. */
function loadChecker(language: LanguageCode): Promise<WordCheck> {
    const existing = checkers.get(language);
    if (existing) return existing;

    const checker = (async (): Promise<WordCheck> => {
        const url = (file: string) => `${dictionaryBase}${language}/${file}`;
        const [aff, dic] = await Promise.all([
            fetchText(url('index.aff')),
            fetchText(url('index.dic'))
        ]);
        // Hunspell compiled to WebAssembly: loads even the largest dictionaries
        // (Italian, Polish, Czech) in well under a second.
        const hunspell = await createHunspellFromStrings(aff, dic);
        const memo = new Map<string, boolean>();
        return (word) => {
            let correct = memo.get(word);
            if (correct === undefined) {
                correct = hunspell.testSpelling(word);
                memo.set(word, correct);
            }
            return correct;
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
): Promise<Map<LanguageCode, WordCheck>> {
    const needed = [...new Set(languages.filter(isLanguageCode))];
    const loaded = await Promise.allSettled(needed.map(loadChecker));
    const result = new Map<LanguageCode, WordCheck>();
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

async function checkSheet(
    request: Extract<SpellcheckRequest, { type: 'check-sheet' }>
) {
    const { sheetId, rows, languages } = request;
    const ignored = new Set(request.ignoredWords);
    const checks = await checkersFor(sheetId, languages);
    const total = rows.reduce((sum, row) => sum + row.length, 0);
    const flags: CellFlags[] = [];
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
            const check =
                language && isLanguageCode(language)
                    ? checks.get(language)
                    : undefined;
            if (!check || text === '') return;
            const ranges = findMisspellings(text, check, ignored);
            if (ranges.length > 0) {
                flags.push({ row: rowIndex, column, text, ranges });
            }
        });
    });

    post({ type: 'sheet-result', sheetId, flags });
}

async function checkCell(
    request: Extract<SpellcheckRequest, { type: 'check-cell' }>
) {
    const { sheetId, row, column, text, language } = request;
    let ranges: CellFlags['ranges'] = [];
    if (isLanguageCode(language) && text !== '') {
        const check = (await checkersFor(sheetId, [language])).get(language);
        if (check) {
            ranges = findMisspellings(
                text,
                check,
                new Set(request.ignoredWords)
            );
        }
    }
    post({ type: 'cell-result', sheetId, cell: { row, column, text, ranges } });
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
