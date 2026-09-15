import type { ParseRequest, ParseResponse, ParseSource } from './protocol';

type PendingParse = {
    resolve: (rows: string[][]) => void;
    reject: (error: Error) => void;
    onProgress: (fraction: number) => void;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingParse>();

function getWorker(): Worker {
    if (worker) return worker;

    worker = new Worker(new URL('./parse.worker.ts', import.meta.url), {
        type: 'module'
    });

    worker.onmessage = ({ data }: MessageEvent<ParseResponse>) => {
        const request = pending.get(data.id);
        if (!request) return;

        if (data.type === 'progress') {
            request.onProgress(data.fraction);
            return;
        }

        pending.delete(data.id);
        if (data.type === 'done') request.resolve(data.rows);
        else request.reject(new Error(data.message));
    };

    worker.onerror = (event) => {
        console.error('CSV parse worker failed', event);
        for (const request of pending.values()) {
            request.reject(new Error(event.message));
        }
        pending.clear();
        worker?.terminate();
        worker = null;
    };

    return worker;
}

/** Parse a CSV file or pasted text off the main thread. */
export function parseInWorker(
    source: ParseSource,
    onProgress: (fraction: number) => void
): Promise<string[][]> {
    return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject, onProgress });
        const request: ParseRequest = { id, source };
        getWorker().postMessage(request);
    });
}
