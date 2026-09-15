import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import SheetTab from '$lib/components/shell/SheetTab.svelte';

import { Sheet } from '$lib/workbook/sheet.svelte';

function setup() {
    const sheet = new Sheet('Sheet 1');
    const renames: string[] = [];
    render(SheetTab, {
        props: {
            sheet,
            active: true,
            onactivate: () => {},
            onclose: () => {},
            onrename: (name: string) => renames.push(name)
        }
    });
    return { sheet, renames };
}

function tab(): HTMLElement {
    const element = document.querySelector<HTMLElement>('[role="tab"]');
    if (!element) throw new Error('No tab');
    return element;
}

/** Waits for the rename field and its focus. */
function renameField(): Promise<HTMLInputElement> {
    return vi.waitFor(() => {
        const input = document.querySelector<HTMLInputElement>(
            'input[aria-label="Rename Sheet 1"]'
        );
        if (!input || document.activeElement !== input) {
            throw new Error('Rename field not focused yet');
        }
        return input;
    });
}

function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function press(target: HTMLElement, key: string) {
    target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    );
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('SheetTab renaming', () => {
    it('renames from the right-click menu', async () => {
        const { renames } = setup();

        tab().dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: 20,
                clientY: 20
            })
        );
        const rename = await vi.waitFor(() => {
            const item = [
                ...document.querySelectorAll<HTMLElement>('[role="menuitem"]')
            ].find((element) => element.textContent?.trim() === 'Rename');
            if (!item) throw new Error('Menu not open yet');
            return item;
        });
        rename.click();

        const input = await renameField();
        expect(input.value).toBe('Sheet 1');
        type(input, '  Budget 2026  ');
        press(input, 'Enter');

        expect(renames).toEqual(['Budget 2026']);
        await expect
            .poll(() => document.querySelector('input[aria-label^="Rename"]'))
            .toBeNull();
    });

    it('starts renaming with F2 and cancels with Escape', async () => {
        const { renames } = setup();
        press(tab(), 'F2');

        const input = await renameField();
        type(input, 'Something else');
        press(input, 'Escape');

        expect(renames).toEqual([]);
        await expect.poll(() => tab().textContent).toContain('Sheet 1');
    });

    it('keeps the old name when the new one is blank or unchanged', async () => {
        const { renames } = setup();

        press(tab(), 'F2');
        let input = await renameField();
        type(input, '   ');
        press(input, 'Enter');

        await expect
            .poll(() => document.querySelector('[role="tab"]'))
            .not.toBeNull();
        press(tab(), 'F2');
        input = await renameField();
        input.blur();

        expect(renames).toEqual([]);
    });
});
