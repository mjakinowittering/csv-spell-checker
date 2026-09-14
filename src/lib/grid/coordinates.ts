/** Spreadsheet column letters for a zero-based index: 0 → A, 25 → Z, 26 → AA. */
export function columnLetter(index: number): string {
    let remaining = index + 1;
    let letters = '';
    while (remaining > 0) {
        const offset = (remaining - 1) % 26;
        letters = String.fromCharCode(65 + offset) + letters;
        remaining = Math.floor((remaining - 1) / 26);
    }
    return letters;
}

/** Spreadsheet cell reference for zero-based row and column: (0, 0) → A1. */
export function cellReference(row: number, column: number): string {
    return `${columnLetter(column)}${row + 1}`;
}
