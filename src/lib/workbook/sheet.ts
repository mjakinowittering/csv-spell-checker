export type Sheet = {
    id: string;
    name: string;
    /** Row 0 is the header row. */
    rows: string[][];
};
