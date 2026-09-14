import type { ColumnLanguage } from '$lib/languages/codes';
import type { LanguageGuess } from '$lib/languages/detect';

export type SheetPhase =
    | { kind: 'parsing'; progress: number }
    | { kind: 'confirming'; guess: LanguageGuess }
    | { kind: 'ready' };

/** One open tab: its parsed rows and where it is in the import flow. */
export class Sheet {
    readonly id = crypto.randomUUID();
    readonly name: string;

    phase = $state<SheetPhase>({ kind: 'parsing', progress: 0 });

    /** Row 0 is the header row. Replaced wholesale, never mutated. */
    rows = $state.raw<string[][]>([]);

    /** One language per column, set only by confirming the language screen. */
    languages = $state.raw<ColumnLanguage[]>([]);

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Record the user's per-column choices. Every new sheet must pass through
     * the confirmation screen; there is no other way to reach `ready`.
     */
    confirmLanguages(languages: ColumnLanguage[]) {
        if (this.phase.kind !== 'confirming') return;
        this.languages = languages;
        this.phase = { kind: 'ready' };
    }
}
