import { setProjectAnnotations } from 'storybook/internal/preview-api';
// @ts-expect-error: a virtual module served by Storybook's Vite builder.
import { getProjectAnnotations } from 'virtual:/@storybook/builder-vite/project-annotations.js';

// The storybook-dark project: every story, dark theme.
setProjectAnnotations([
    getProjectAnnotations(),
    { initialGlobals: { theme: 'dark' } }
]);
