import { browser } from '$app/environment';

// A device preference, not part of any sheet, so it lives in localStorage
// rather than the IndexedDB workbook.
const STORAGE_KEY = 'csv-spell-checker:allow-grammarly';

function read(): boolean {
    if (!browser) return false;
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (error) {
        console.error('Could not read the Grammarly preference', error);
        return false;
    }
}

function write(allowed: boolean) {
    try {
        localStorage.setItem(STORAGE_KEY, String(allowed));
    } catch (error) {
        console.error('Could not save the Grammarly preference', error);
    }
}

/** Whether Grammarly may run in the cell editor. Blocked by default. */
class GrammarlyPreference {
    #allowed = $state(read());

    get allowed(): boolean {
        return this.#allowed;
    }

    set allowed(allowed: boolean) {
        this.#allowed = allowed;
        write(allowed);
    }
}

export const grammarlyPreference = new GrammarlyPreference();
