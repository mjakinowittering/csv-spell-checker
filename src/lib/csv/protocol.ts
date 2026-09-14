import type { LanguageGuess } from '$lib/languages/detect';

export type ParseSource =
    { kind: 'file'; file: File } | { kind: 'text'; text: string };

export type ParseRequest = { id: number; source: ParseSource };

export type ParseResult = { rows: string[][]; guess: LanguageGuess };

export type ParseResponse =
    | { id: number; type: 'progress'; fraction: number }
    | ({ id: number; type: 'done' } & ParseResult)
    | { id: number; type: 'error'; message: string };
