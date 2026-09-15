import { describe, expect, it } from 'vitest';

import { grammarlyAttributes } from '$lib/editor/grammarly';

describe('grammarlyAttributes', () => {
    it('blocks Grammarly with all three opt-out attributes by default', () => {
        expect(grammarlyAttributes(false)).toEqual({
            'data-gramm': 'false',
            'data-gramm_editor': 'false',
            'data-enable-grammarly': 'false'
        });
    });

    it('adds nothing once the user allows Grammarly', () => {
        expect(grammarlyAttributes(true)).toEqual({});
    });
});
