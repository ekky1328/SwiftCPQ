# Design system reference (post phase 1)

This is the cheat-sheet for the next agent. Everything below is **shipped and live** in the dev build.

## Where things live

```
client/src/
  styles/
    tokens.css         # ~660 lines — verbatim from the design bundle
    preset.ts          # PrimeVue v4 definePreset(Aura, ...) wired to tokens
  composables/
    useTheme.ts        # mode + accent + persistence
  ui/
    AppShell.vue       # 200px sidenav + main column grid
    SideNav.vue        # brand, Workspace, Admin sections, user footer
    TopBar.vue         # breadcrumb + spacer + slot
    StatusBar.vue      # 24px footer with status dot + slots
    Btn.vue            # default | primary | ghost | danger; icon, kbd, slot
    Tag.vue            # success | warn | error | info | accent; dot variant
    Kbd.vue            # inline keyboard hint
    Icon.vue           # unicode-glyph map (no icon font in the mock)
```

The bundle source — `swiftcpq/project/components/Shell.jsx`, `tokens.css`, etc. — lives at `.claude-design-tmp/swiftcpq/project/` (gitignored). Reference it, don't import it.

## CSS class system (`.swift-*`)

Defined in `tokens.css`. Use directly in Vue templates.

| Class | What |
| ----- | ---- |
| `swift-app` | Sets font, color, bg. Combine with `.theme-dark` or `.theme-light`. |
| `swift-shell` | Grid: `200px 1fr`, full height. Wraps SideNav + main. |
| `swift-main` | Flex column inside the shell, `min-width: 0`. |
| `swift-content` | `flex: 1; overflow: auto;` — the scroll region inside `.swift-main`. |
| `swift-sidenav` / `__brand` / `__section` / `__link` / `__footer` / `__avatar` | Sidebar parts. |
| `swift-topbar` / `swift-crumb` / `swift-topbar__spacer` | Top bar parts. |
| `swift-btn` / `--primary` / `--ghost` / `--danger` / `--icon` | Buttons. Prefer `<Btn>`. |
| `swift-btn-group` | Inline group of buttons (e.g. Save · ▾). |
| `swift-input` / `swift-select` / `swift-search` / `swift-label` | Form fields (26px). |
| `swift-table` (+ `.col-num`, `.col-currency`, `.col-id`, `.row-actions`, `tr.selected`) | Dense data table. |
| `swift-tag` (+ `--success` / `--warn` / `--error` / `--info` / `--accent` / `--dot`) | Pills / badges. |
| `swift-panel` / `__header` / `__body` / `__body--flush` | Card. |
| `swift-tabs` / `swift-tab` (+ `.active`) / `swift-tab .count` | Tab strip. |
| `swift-empty` | Empty-state placeholder. |
| `swift-divider` | 1px hairline. |
| `swift-kbd` | Standalone kbd hint (use `<Kbd>`). |
| `swift-status-dot` | 6px dot. Set `background: var(--success|warn|error|info)`. |

## Theme tokens (CSS custom props)

All driven by the `.theme-dark` / `.theme-light` class on `<html>`.

- **Surfaces** — `--surface-0` (app bg) → `--surface-500`. `0/50/100/200/300` are the hot ones.
- **Borders** — `--border` (1px hairline), `--border-strong`, `--border-subtle`.
- **Text** — `--text-1` (primary), `--text-2` (secondary), `--text-3` (muted), `--text-4` (placeholder).
- **Accent** — `--accent`, `--accent-hover`, `--accent-fg`, `--accent-bg` (12–18% transparent), `--focus-ring`.
- **Status** — `--success/-bg`, `--warn/-bg`, `--error/-bg`, `--info/-bg`. Use the `-bg` variants behind text.
- **Type** — `--font-ui` (Inter Variable), `--font-mono` (JetBrains Mono Variable). Sizes `--fs-xs..3xl` (11/12/13/14/16/20/24).
- **Spacing** — `--s-1..9` (2/4/6/8/12/16/20/24/32px).
- **Radius** — `--r-sm` (2), `--r-md` (3), `--r-lg` (4), `--r-pill` (999).
- **Rows** — `--row-input` (26), `--row-compact` (28), `--row-default` (32).

## `useTheme()`

```ts
import { useTheme } from '@/composables/useTheme';
const { mode, accent, setMode, setAccent } = useTheme();
// mode: 'dark' | 'light'   (default: 'dark')
// accent: 'amber' | 'indigo' | 'violet' | 'green' | 'red'   (default: 'amber')
```

Persists to `localStorage.swiftcpq.theme.mode` / `.accent`. Toggles `<html>.theme-dark`, `.theme-light`, and `.dark` (the latter so PrimeVue's `darkModeSelector: '.dark'` fires for component-internal styling). Injects per-accent overrides into a `<style id="swiftcpq-accent-style">`.

## PrimeVue preset (`styles/preset.ts`)

Built with `definePreset(Aura, {...})`. Mirrors the same semantic tokens (surface, formField, content, list, navigation, overlay, primary) into PrimeVue's tree, with separate `colorScheme.dark.*` and `.light.*` blocks. Both schemes resolve `var(--surface-N)`, `var(--text-N)`, `var(--accent)`, etc. from `tokens.css` — **single source of truth**.

When PrimeVue components look wrong in a phase 2+ migration, two playbooks:
1. **Cosmetic miss** (border color, padding, radius): extend the preset.
2. **Density miss** (heights, internal node layout): write a `pt` override on the component instance, or add a global `ptOptions` in `main.ts`. Don't fork PrimeVue.

The bundle's chat transcript (`chats/chat1.md`) suggests writing a per-component `pt` cookbook in phase 2 alongside the Proposal Editor's DataTable. That's where to put generic `pt` overrides for `Button`, `DataTable`, `Tabs`, `Tag`, `Panel`, `Dialog`.

## Decision rules

- Need a button? → `<Btn>`.
- Need a status pill? → `<Tag>`.
- Need a kbd hint? → `<Kbd>` (or pass `kbd="..."` to `<Btn>`).
- Need a layout chrome thing (sidebar / topbar / status bar)? → use the `.swift-*` class directly or wrap in a small Vue SFC.
- Need a complex interactive widget (sortable list, picker, dialog, editor)? → reach for PrimeVue.
- Need a data grid with inline editing, virtual scrolling, column resizing? → PrimeVue `DataTable` + `pt` overrides.
- Need a hand-rolled dense list table without inline editing? → `<table class="swift-table">`.

## Known gaps to address in later phases

- The dev-mode yellow banner (`IS_DEV_BUILD` from `App.vue`) was dropped during phase 1 because it broke the new full-height grid. Re-introduce as a `<Tag kind="warn">` chip in the topbar or sidenav footer when needed.
- `ProposalList` has TODO comments where the backend lacks fields (owner, total value, status taxonomy beyond `draft`). Phase 2 should consider whether to add these to the API or render them lazily.
- Quill editor (`#app .p-editor`) has a re-skinned border in `App.vue` global styles, but the toolbar buttons + dropdown still inherit Quill defaults. Phase 2 should consider whether to keep Quill or move to PrimeVue's `Editor` more tightly themed.
