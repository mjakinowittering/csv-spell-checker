/** One committed cell edit, with enough to reverse or replay it. */
export type CellEdit = {
    row: number;
    column: number;
    before: string;
    after: string;
};

/**
 * One undo step: a single edit, or every cell a sheet-wide fix rewrote, which
 * undo and redo apply together.
 */
export type EditStep = readonly CellEdit[];

/** Undo/redo stacks of edit steps for one sheet. */
export class EditHistory {
    #undo = $state.raw<EditStep[]>([]);
    #redo = $state.raw<EditStep[]>([]);

    canUndo = $derived(this.#undo.length > 0);
    canRedo = $derived(this.#redo.length > 0);

    /** Record a new step. Anything that could have been redone is dropped. */
    push(step: EditStep) {
        if (step.length === 0) return;
        this.#undo = [...this.#undo, step];
        this.#redo = [];
    }

    /** The step to reverse, moved onto the redo stack. */
    undo(): EditStep | null {
        const step = this.#undo.at(-1);
        if (!step) return null;
        this.#undo = this.#undo.slice(0, -1);
        this.#redo = [...this.#redo, step];
        return step;
    }

    /** The step to replay, moved back onto the undo stack. */
    redo(): EditStep | null {
        const step = this.#redo.at(-1);
        if (!step) return null;
        this.#redo = this.#redo.slice(0, -1);
        this.#undo = [...this.#undo, step];
        return step;
    }
}
