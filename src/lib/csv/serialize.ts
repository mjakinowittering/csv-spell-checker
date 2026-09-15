// A field needs quoting when it holds a delimiter, a quote or a line break,
// or starts or ends with whitespace that a spreadsheet would otherwise trim.
const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;

/**
 * Serialise rows as RFC 4180 CSV: comma separated, CRLF line endings, fields
 * quoted only when needed, with embedded quotes doubled. The inverse of
 * `parseDelimited(text, { delimiter: ',' })`.
 */
export function serializeCsv(rows: readonly (readonly string[])[]): string {
    return rows.map((row) => row.map(quoteField).join(',') + '\r\n').join('');
}

function quoteField(value: string): string {
    return NEEDS_QUOTES.test(value)
        ? `"${value.replaceAll('"', '""')}"`
        : value;
}
