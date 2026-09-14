export type SheetPhase =
    { kind: 'parsing'; progress: number } | { kind: 'ready' };

/** One open tab: its parsed rows and where it is in the import flow. */
export class Sheet {
    readonly id = crypto.randomUUID();
    readonly name: string;

    phase = $state<SheetPhase>({ kind: 'parsing', progress: 0 });

    /** Row 0 is the header row. Replaced wholesale, never mutated. */
    rows = $state.raw<string[][]>([]);

    constructor(name: string) {
        this.name = name;
    }
}
