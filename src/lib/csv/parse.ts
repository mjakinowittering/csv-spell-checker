export type ParseOptions = {
    delimiter: string;
    /** Called with a 0–1 fraction as parsing advances. */
    onProgress?: (fraction: number) => void;
};

const PROGRESS_INTERVAL = 1 << 16;
const DELIMITER_CANDIDATES = [',', ';', '\t'] as const;

/**
 * Parse RFC 4180 delimited text into rows of cell values.
 *
 * Quoted fields may contain delimiters, doubled quotes and line breaks. CRLF,
 * LF and CR line endings are accepted, a leading UTF-8 BOM is dropped, trailing
 * empty lines are dropped, and ragged rows are padded to the widest row.
 */
export function parseDelimited(
    input: string,
    { delimiter, onProgress }: ParseOptions
): string[][] {
    const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
    const length = text.length;
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;
    let nextProgress = PROGRESS_INTERVAL;

    for (let i = 0; i < length; i++) {
        if (onProgress && i >= nextProgress) {
            onProgress(i / length);
            nextProgress += PROGRESS_INTERVAL;
        }

        const char = text[i];

        if (quoted) {
            if (char !== '"') {
                field += char;
            } else if (text[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                quoted = false;
            }
        } else if (char === '"' && field === '') {
            quoted = true;
        } else if (char === delimiter) {
            row.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }

    // The last line has no terminating line break.
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    while (
        rows.length > 0 &&
        rows[rows.length - 1].every((cell) => cell === '')
    ) {
        rows.pop();
    }

    onProgress?.(1);
    return padRows(rows);
}

/** Guess a CSV file's delimiter from its first line: comma, semicolon or tab. */
export function detectDelimiter(text: string): string {
    const counts = new Map<string, number>(
        DELIMITER_CANDIDATES.map((candidate) => [candidate, 0])
    );
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') quoted = !quoted;
        else if (!quoted && (char === '\n' || char === '\r')) break;
        else if (!quoted && counts.has(char)) {
            counts.set(char, (counts.get(char) ?? 0) + 1);
        }
    }

    let best = ',';
    for (const [candidate, count] of counts) {
        if (count > (counts.get(best) ?? 0)) best = candidate;
    }
    return best;
}

function padRows(rows: string[][]): string[][] {
    const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
    for (const row of rows) {
        while (row.length < width) row.push('');
    }
    return rows;
}
