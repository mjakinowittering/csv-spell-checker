import '../src/routes/layout.css';

import StoryDecorator from '../src/stories/StoryDecorator.svelte';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/sveltekit';

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        },
        // Every story is checked for accessibility, in the light and the
        // dark theme (the storybook-light and storybook-dark test projects),
        // and any violation fails the run.
        a11y: {
            test: 'error'
        }
    },
    decorators: [
        () => ({ Component: StoryDecorator }),
        // The app's dark theme is the `dark` class on <html>, as mode-watcher
        // sets it.
        withThemeByClassName({
            themes: { light: '', dark: 'dark' },
            defaultTheme: 'light',
            parentSelector: 'html'
        })
    ]
};

export default preview;
