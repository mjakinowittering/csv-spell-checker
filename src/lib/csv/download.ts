/** A file name for a sheet: its name, without characters file systems reject. */
export function csvFileName(sheetName: string): string {
    const base = sheetName
        .replace(/\.csv$/i, '')
        .replace(/[\\/:*?"<>|]+/g, '-')
        .trim();
    return `${base || 'sheet'}.csv`;
}

/** Save CSV text as a file through a temporary object URL. */
export function downloadCsv(fileName: string, csv: string) {
    // The byte-order mark makes Excel read the file as UTF-8, so accented
    // letters, ß and ñ survive the round trip.
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    // Revoke after the click has handed the URL to the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
