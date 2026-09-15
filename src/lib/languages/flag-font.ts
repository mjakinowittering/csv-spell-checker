import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import fontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url';

/** Must lead the app's font stack (`--font-sans` in layout.css). */
export const FLAG_FONT_FAMILY = 'Twemoji Country Flags';

/**
 * Chromium on Windows has emoji but no flag emoji. Only there, load a
 * self-hosted font of flags; everywhere else nothing is downloaded.
 * Returns whether the font was needed.
 */
export function loadFlagFont(): boolean {
    return polyfillCountryFlagEmojis(FLAG_FONT_FAMILY, fontUrl);
}
