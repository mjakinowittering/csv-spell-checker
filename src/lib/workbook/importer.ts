import { toast } from 'svelte-sonner';

import { parseInWorker } from '$lib/csv/parser';
import type { ParseSource } from '$lib/csv/protocol';
import { m } from '$lib/paraglide/messages';

import { Sheet } from './sheet.svelte';
import type { Workbook } from './workbook.svelte';

const pasteTime = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });

export function isCsvFile(file: File): boolean {
    return /\.csv$/i.test(file.name) || file.type === 'text/csv';
}

/** Open each CSV file in its own new tab. Anything else is refused. */
export function importFiles(workbook: Workbook, files: Iterable<File>) {
    for (const file of files) {
        if (!isCsvFile(file)) {
            toast.error(m.import_not_csv_error({ name: file.name }));
            continue;
        }
        const sheet = new Sheet(
            m.tabs_upload_name({ number: workbook.nextUploadNumber() }),
            file.name
        );
        void load(workbook, sheet, { kind: 'file', file }, file.name);
    }
}

/** Open pasted spreadsheet cells in a new tab. Never merges into a sheet. */
export function importPastedText(workbook: Workbook, text: string) {
    if (text.trim() === '') {
        toast.error(m.import_clipboard_empty_error());
        return;
    }
    const sheet = new Sheet(
        m.tabs_paste_name({ time: pasteTime.format(new Date()) })
    );
    void load(workbook, sheet, { kind: 'text', text }, sheet.name);
}

async function load(
    workbook: Workbook,
    sheet: Sheet,
    source: ParseSource,
    displayName: string
) {
    // The tab appears immediately; parsing progress shows inside it.
    workbook.open(sheet);

    try {
        const { rows, guess } = await parseInWorker(source, (progress) => {
            sheet.phase = { kind: 'parsing', progress };
        });

        if (rows.length === 0) {
            workbook.close(sheet.id);
            toast.error(m.import_empty_error({ name: displayName }));
            return;
        }

        sheet.rows = rows;
        // Always ask: no sheet skips language confirmation.
        sheet.phase = { kind: 'confirming', guess };
    } catch (error) {
        console.error('Could not parse', displayName, error);
        workbook.close(sheet.id);
        toast.error(m.import_parse_error({ name: displayName }));
    }
}
