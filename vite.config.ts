import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname =
    typeof __dirname !== 'undefined'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));

function basePath(): '' | `/${string}` {
    const base = process.env.BASE_PATH ?? '';
    return base.startsWith('/') ? (base as `/${string}`) : '';
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit({
            compilerOptions: {
                // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes('node_modules')
                        ? undefined
                        : true
            },
            // Static SPA for GitHub Pages: 404.html is the fallback Pages serves
            // for unknown paths, and BASE_PATH (set by configure-pages in CI) is
            // the repo subpath the site is served from.
            adapter: adapter({ fallback: '404.html' }),
            paths: {
                base: process.argv.includes('dev') ? '' : basePath()
            }
        }),
        paraglideVitePlugin({
            project: './project.inlang',
            outdir: './src/lib/paraglide',
            emitTsDeclarations: true
        })
    ],
    // Pre-bundling the grid in dev breaks reactivity in the custom cell
    // components it mounts: cells never re-render after an edit (production
    // builds are unaffected). Compiling it from source like app code fixes it.
    optimizeDeps: {
        exclude: ['wx-svelte-grid']
    },
    // Parse and spellcheck workers are ES modules with their own imports.
    worker: {
        format: 'es'
    },
    test: {
        expect: {
            requireAssertions: true
        },
        projects: [
            {
                extends: './vite.config.ts',
                test: {
                    name: 'client',
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        instances: [
                            {
                                browser: 'chromium',
                                headless: true
                            }
                        ]
                    },
                    include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
                    exclude: ['src/lib/server/**']
                }
            },
            {
                extends: './vite.config.ts',
                test: {
                    name: 'server',
                    environment: 'node',
                    include: ['src/**/*.{test,spec}.{js,ts}'],
                    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
                }
            },
            // Every story runs twice, once per theme, with its a11y checks.
            ...(['light', 'dark'] as const).map((theme) => ({
                extends: true as const,
                plugins: [
                    // See https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
                    storybookTest({
                        configDir: path.join(dirname, '.storybook')
                    })
                ],
                test: {
                    name: `storybook-${theme}`,
                    setupFiles: [`./.storybook/vitest.setup.${theme}.ts`],
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [{ browser: 'chromium' as const }]
                    }
                }
            }))
        ],
        // The grid's resize observer can report a harmless loop warning.
        onUnhandledError(error) {
            if (error.message?.includes('ResizeObserver loop')) return false;
        }
    }
});
