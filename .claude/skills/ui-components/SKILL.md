---
name: ui-components
description: shadcn-svelte (Vega style) usage and theming — components are copied into `src/lib/components/ui/` via the CLI, the doc URL pattern for exact props, trigger/child-snippet and icon patterns, prop ordering, and mode-watcher light/dark theming. Load when building any UI, choosing a component, needing exact prop names / variants, or touching the theme toggle. Never hand-roll buttons, inputs, selects or other form elements.
---

# shadcn-svelte (Vega)

shadcn-svelte is the only component library. Components are copied into the
project, not installed as a package. Never hand-roll buttons, inputs, selects,
textareas or dialogs — `CLAUDE.md`: no ad hoc HTML form elements.

Add components with the CLI (style, aliases and icon library come from
`components.json`):

```sh
npx shadcn-svelte@latest add <name> [<name>...] --yes
```

If a component you add depends on one already present (most depend on `button`),
the CLI stops at an interactive overwrite prompt. Add `--overwrite`; files under
`ui/` are never hand-edited, so overwriting loses nothing.

**Do not hand-edit anything under `ui/`.** The next `add` overwrites it. Change the
call site instead. `ui/` is excluded from Prettier and ESLint for the same reason —
it is generated code in shadcn's own formatting.

**Only what the app renders is checked in.** A component nobody imports is deleted
rather than kept "in case" — it is one command away.

## Documentation

- Component index: `https://www.shadcn-svelte.com/llms.txt`
- One component: `https://shadcn-svelte.com/docs/components/{name}.md` — fetch it
  when you need exact props, variants or composition.

The generated source in `ui/<name>/` is the final word on this project's variants
(the Vega style's `size` values, for example, include `xs`, `icon-xs`, `icon-sm`).

## Patterns used here

### Triggers wrap a Button through the `child` snippet

Tooltip, DropdownMenu, Dialog and Select triggers render their own element. To
make the trigger a shadcn `Button`, pass behaviour props to the trigger and spread
the merged `props` onto the Button — never nest a button inside a button:

```svelte
<Tooltip.Trigger {disabled} {onclick} aria-label={label}>
    {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon-sm"><Icon /></Button>
    {/snippet}
</Tooltip.Trigger>
```

`Tooltip.Provider` is mounted once in the root layout.

### Icons

Lucide, imported per icon so only used icons ship:

```ts
import type { LucideIcon } from '@lucide/svelte'; // for icon props
import XIcon from '@lucide/svelte/icons/x';
```

Type an icon prop as `LucideIcon`, not `Component<IconProps>` — `IconProps`
requires `icon`/`iconNode` and will not type-check.

### Overriding variant-scoped classes

Some Vega components style by data attribute, e.g. Separator uses
`data-vertical:self-stretch`. `tailwind-merge` only resolves conflicts within the
same variant, so a plain `self-center` does not win. Override with the same
variant: `class="data-vertical:h-5 data-vertical:self-center"`.

### Spinner needs an explicit stroke

The generated `Spinner` forwards `stroke={undefined}` to lucide's icon, which
removes lucide's default `stroke="currentColor"` — the spinner renders but is
invisible. Always pass it: `<Spinner stroke="currentColor" class="size-4" />`.

### Language flags

`LanguageFlags` (`components/languages/`) shows a sheet's checked languages
(`sheet.checkedLanguages`): one language is its flag emoji plus the code
(🇬🇧 en-GB); several stack one flag per language in an `Avatar.Group`, with an
`Avatar.GroupCount` "+N" past `max`, and "Mixed". It is used in the toolbar, before each tab
name (`showCode={false}`, `size="xs"`), and its visuals are `aria-hidden` with
an sr-only "Spell-checked in …" label. Flags come from `languageFlag` in
`src/lib/languages/flags.ts`; the status bar reuses it for the selected cell.

Chromium on Windows cannot draw flag emoji. `loadFlagFont()` (called once from
the root layout) runs `country-flag-emoji-polyfill` with the package's own
`TwemojiCountryFlags.woff2` imported via `?url`, so the font is self-hosted and
only downloaded where needed. `'Twemoji Country Flags'` leads `--font-sans`; its
`unicode-range` covers flags only, so every other glyph still uses Inter.

### File pickers

A file picker still goes through shadcn: a visually hidden `Input type="file"`
opened from a `Button` via its `ref`. Drag-and-drop targets are plain containers
with drop handlers, not form elements.

The `Input` binds `value` on the file input. To reset it (so choosing the same
file again fires `change`), bind your own state with `bind:value` and set that
to `''`. Assigning `input.value = ''` directly makes the binding write the old
fake path back, which the browser rejects with an exception.

## Prop ordering in `$props()`

Order destructured props — and the type annotation, which mirrors it 1:1 — by
semantic prominence:

1. **Content / identity** — what the component is: `sheet`, `icon`, `label`,
   `title`.
2. **State and behaviour** — values and flags: `activeId`, `disabled = false`.
3. **Callbacks** — `onclose`, `onupload`. Optional callbacks that are not wired
   yet render their control disabled rather than silently doing nothing.
4. **`class: className` last** — the styling escape hatch.

This is a judgement call and is not linted. Reference: `ToolbarButton.svelte`,
`SheetTabs.svelte`.

## Theming

Theme uses `mode-watcher`:

- `<ModeWatcher />` is mounted once in `src/routes/+layout.svelte`. With no props
  it defaults to `system`, i.e. OS `prefers-color-scheme`, and tracks OS changes.
- The manual toggle is `ThemeToggle.svelte`: a DropdownMenu radio group bound to
  `userPrefersMode.current`, calling `setMode('light' | 'dark' | 'system')`. The
  choice persists in localStorage; `system` returns control to the OS.
- Components read the resolved mode from `mode.current` when they must pick
  between non-CSS themes (e.g. a third-party grid theme). Everything else uses
  the `dark:` variant and the CSS tokens in `src/routes/layout.css`.
- Never read `prefers-color-scheme` yourself or add a second theme store.
