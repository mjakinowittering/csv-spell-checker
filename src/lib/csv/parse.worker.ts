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
        post({ id, type: 'done', rows });
    } catch (error) {
        post({
            id,
            type: 'error',
            message: error instanceof Error ? error.message : String(error)
        });
    }
};
