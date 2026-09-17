import type { LanguageCode } from '$lib/languages/codes';
import type { Sheet } from '$lib/workbook/sheet.svelte';

import type { SpellcheckRequest, SpellcheckResponse } from './protocol';

/**
 * Main-thread side of the spellcheck worker. Full-sheet checks only ever run
 * in the worker; this class posts work and routes results to their sheet.
 */
export class Spellchecker {
    #worker: Worker | null = null;
    #sheets = new Map<string, Sheet>();
    #dictionaryBase: () => string;
    #ondictionaryerror: (language: LanguageCode) => void;

    /**
     * @param dictionaryBase Resolves where dictionaries are served from. Called
     * only when the worker starts, so it may use browser globals.
     */
    constructor(
        dictionaryBase: () => string,
        ondictionaryerror: (language: LanguageCode) => void
    ) {
        this.#dictionaryBase = dictionaryBase;
        this.#ondictionaryerror = ondictionaryerror;
    }

    /** Check every cell of a sheet whose languages were just confirmed. */
    checkSheet(sheet: Sheet) {
        this.#sheets.set(sheet.id, sheet);
        sheet.beginCheck();
        this.#post({
            type: 'check-sheet',
            sheetId: sheet.id,
            rows: sheet.snapshot(),
            languages: [...sheet.languages],
            ignoredWords: [...sheet.ignoredWords]
        });
    }

    /** Re-check a single cell after it changed. Never the whole sheet. */
    checkCell(sheet: Sheet, row: number, column: number) {
        this.#sheets.set(sheet.id, sheet);
        this.#post({
            type: 'check-cell',
            sheetId: sheet.id,
            row,
            column,
            text: sheet.cellValue(row, column),
            language: sheet.languages[column] ?? 'none',
            ignoredWords: [...sheet.ignoredWords]
        });
    }

    /** Stop routing results to a closed sheet. */
    release(sheetId: string) {
        this.#sheets.delete(sheetId);
    }

    #post(request: SpellcheckRequest) {
        this.#getWorker().postMessage(request);
    }

    #getWorker(): Worker {
        if (this.#worker) return this.#worker;

        const worker = new Worker(
            new URL('./spellcheck.worker.ts', import.meta.url),
            { type: 'module' }
        );
        worker.onmessage = ({ data }: MessageEvent<SpellcheckResponse>) =>
            this.#receive(data);
        worker.onerror = (event) => {
            console.error('Spellcheck worker failed', event);
        };
        const init: SpellcheckRequest = {
            type: 'init',
            dictionaryBase: this.#dictionaryBase()
        };
        worker.postMessage(init);
        this.#worker = worker;
        return worker;
    }

    #receive(response: SpellcheckResponse) {
        const sheet = this.#sheets.get(response.sheetId);
        if (!sheet) return;

        switch (response.type) {
            case 'sheet-progress':
                sheet.setCheckProgress(response.fraction);
                break;
            case 'sheet-result':
                sheet.applySheetFlags(response.flags, response.languages);
                break;
            case 'cell-result':
                sheet.applyCellFlags(response.cell, response.languages);
                break;
            case 'dictionary-error':
                this.#ondictionaryerror(response.language);
                break;
        }
    }
}
