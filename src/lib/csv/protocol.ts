export type ParseSource =
    { kind: 'file'; file: File } | { kind: 'text'; text: string };

export type ParseRequest = { id: number; source: ParseSource };

export type ParseResponse =
    | { id: number; type: 'progress'; fraction: number }
    | { id: number; type: 'done'; rows: string[][] }
    | { id: number; type: 'error'; message: string };
