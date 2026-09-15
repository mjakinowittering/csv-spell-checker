/** One committed cell edit, with enough to reverse or replay it. */
export type CellEdit = {
    row: number;
    column: number;
    before: string;
    after: string;
};

/** Undo/redo stacks of cell edits for one sheet. */
export class EditHistory {
    #undo = $state.raw<CellEdit[]>([]);
    #redo = $state.raw<CellEdit[]>([]);

    canUndo = $derived(this.#undo.length > 0);
    canRedo = $derived(this.#redo.length > 0);

    /** Record a new edit. Anything that could have been redone is dropped. */
    push(edit: CellEdit) {
        this.#undo = [...this.#undo, edit];
        this.#redo = [];
    }

    /** The edit to reverse, moved onto the redo stack. */
    undo(): CellEdit | null {
        const edit = this.#undo.at(-1);
        if (!edit) return null;
        this.#undo = this.#undo.slice(0, -1);
        this.#redo = [...this.#redo, edit];
        return edit;
    }

    /** The edit to replay, moved back onto the undo stack. */
    redo(): CellEdit | null {
        const edit = this.#redo.at(-1);
        if (!edit) return null;
        this.#redo = this.#redo.slice(0, -1);
        this.#undo = [...this.#undo, edit];
        return edit;
    }
}
