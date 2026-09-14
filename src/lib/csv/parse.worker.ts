import { detectLanguage, englishVariantFor } from '$lib/languages/detect';

import { detectDelimiter, parseDelimited } from './parse';
import type { ParseRequest, ParseResponse } from './protocol';

function post(response: ParseResponse) {
    self.postMessage(response);
}

self.onmessage = async ({
    data: { id, source }
}: MessageEvent<ParseRequest>) => {
    try {
        const text =
            source.kind === 'file' ? await source.file.text() : source.text;
        // Cells copied from a spreadsheet always arrive tab separated.
        const delimiter = source.kind === 'file' ? detectDelimiter(text) : '\t';
        const rows = parseDelimited(text, {
            delimiter,
            onProgress: (fraction) => post({ id, type: 'progress', fraction })
        });
        // One sheet-wide guess from a small sample; running it here keeps
        // Franc's language data out of the main bundle.
        const guess = detectLanguage(
            rows,
            englishVariantFor(navigator.languages)
        );
        post({ id, type: 'done', rows, guess });
    } catch (error) {
        post({
            id,
            type: 'error',
            message: error instanceof Error ? error.message : String(error)
        });
    }
};
