// Copies the Hunspell dictionaries the spellcheck worker fetches into
// static/dictionaries/<language>/. The dictionary-* packages only expose their
// files through Node's fs, so they cannot be imported into the browser build.
// Runs before dev, build and test; the output is gitignored.
//
// Keep the codes in step with LANGUAGE_CODES in src/lib/languages/codes.ts.
import { cp, mkdir } from 'node:fs/promises';

const DICTIONARIES = {
    'en-GB': 'dictionary-en-gb',
    'en-US': 'dictionary-en',
    fr: 'dictionary-fr',
    de: 'dictionary-de',
    it: 'dictionary-it',
    es: 'dictionary-es',
    'pt-PT': 'dictionary-pt-pt',
    // dictionary-pt is Brazilian Portuguese (dictionary-pt-br is deprecated).
    'pt-BR': 'dictionary-pt',
    nl: 'dictionary-nl',
    pl: 'dictionary-pl',
    sv: 'dictionary-sv',
    da: 'dictionary-da',
    nb: 'dictionary-nb',
    cs: 'dictionary-cs'
};

for (const [language, pkg] of Object.entries(DICTIONARIES)) {
    const from = new URL(`../node_modules/${pkg}/`, import.meta.url);
    const to = new URL(`../static/dictionaries/${language}/`, import.meta.url);
    await mkdir(to, { recursive: true });
    for (const file of ['index.aff', 'index.dic', 'license']) {
        await cp(new URL(file, from), new URL(file, to));
    }
}
