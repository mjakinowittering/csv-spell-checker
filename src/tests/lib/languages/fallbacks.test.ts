import { describe, expect, it } from 'vitest';

import { LANGUAGE_CODES } from '$lib/languages/codes';
import { fallbackChain } from '$lib/languages/fallbacks';

describe('fallbackChain', () => {
    it.each([
        ['en-GB', ['en-US']],
        ['en-US', ['en-GB']],
        ['de', ['en-GB', 'en-US', 'nl']],
        ['nl', ['en-GB', 'en-US', 'de']],
        ['fr', ['en-GB', 'en-US', 'it', 'es', 'pt-PT', 'pt-BR']],
        ['es', ['en-GB', 'en-US', 'fr', 'it', 'pt-PT', 'pt-BR']],
        ['pl', ['en-GB', 'en-US', 'cs']],
        ['nb', ['en-GB', 'en-US', 'sv', 'da']]
    ] as const)('tries English then %s’s family', (primary, expected) => {
        expect(fallbackChain(primary)).toEqual(expected);
    });

    it('never repeats a language or includes the primary', () => {
        for (const primary of LANGUAGE_CODES) {
            const chain = fallbackChain(primary);
            expect(chain).not.toContain(primary);
            expect(new Set(chain).size).toBe(chain.length);
        }
    });
});
