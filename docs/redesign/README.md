# SwiftCPQ — Power-User Redesign

Migration from the legacy light Aura UI to a Linear/Datadog-style dense, dark-first workbench.

## Source of truth

- **Design bundle (extracted):** `.claude-design-tmp/` (gitignored). Contains the full handoff:
  - `swiftcpq/README.md` — the design author's instructions
  - `swiftcpq/chats/chat1.md` — the design rationale and back-and-forth
  - `swiftcpq/project/SwiftCPQ Power-User Redesign.html` — the canvas with all artboards
  - `swiftcpq/project/styles/tokens.css` — the verbatim source for `client/src/styles/tokens.css`
  - `swiftcpq/project/components/*.jsx` — React mockups, one per screen
- **Bundle URL (re-fetchable):** `https://api.anthropic.com/v1/design/h/9JNjJToRWcifRZjNrRZ3Hw`

If `.claude-design-tmp/` is missing, re-extract by `WebFetch`-ing the URL above (the response is gzipped tar) into the project tmp dir.

## Status

| Phase | Screen | Status | Notes |
| ----- | ------ | ------ | ----- |
| 1 | Design system + Shell + Proposal List | **Done** | This PR. See [design-system.md](design-system.md). |
| 2 | Proposal Editor (the hero) | Pending | [phase-2-proposal-editor.md](phase-2-proposal-editor.md) |
| 3 | Catalogue list + Item + Bundle detail | Pending | [phase-3-catalogue.md](phase-3-catalogue.md) |
| 4 | Proposal Preview / PDF | Pending | [phase-4-proposal-preview.md](phase-4-proposal-preview.md) |
| 5 | Settings: theme + accent toggles | Pending | [phase-5-settings-and-theme.md](phase-5-settings-and-theme.md) |
| 6 | Login redesign | Pending | [phase-6-login.md](phase-6-login.md) |

## Working principles (carry forward into every phase)

1. **Dark mode is primary.** Light is the inversion, not the default.
2. **Density first.** 13px base, 26px controls, 32px rows, 1px hairlines, 2/3/4px radii. No shadows except true overlays.
3. **One accent.** Amber by default; swap via `useTheme().setAccent(...)`. Never hardcode hex colors.
4. **Tabular figures.** All numeric / ID columns use `font-family: var(--font-mono)` + `font-variant-numeric: tabular-nums`. Use the `.col-num`, `.col-currency`, `.col-id` helpers in `.swift-table`.
5. **Keyboard-first.** Surface kbd hints inline (`<Btn kbd="⌘S">Save</Btn>`). Plan phase-2 onwards for ⌘K command palette.
6. **Use design-system primitives.** New code reaches for `Btn`, `Tag`, `Icon`, `Kbd`, `TopBar`, `StatusBar` from `client/src/ui/`. Reach for PrimeVue components when they materially help (DataTable, Dialog, Toast, Editor); skip them when a `.swift-*` class is sufficient.
7. **Preserve the API surface.** Each screen migration should re-use the existing api/ functions and Pinia stores; don't refactor data layer concurrently.

## How to continue

Pick the next pending phase. Read its handover doc top-to-bottom — each one has a "First steps for the next agent" checklist that gets you productive in under 5 minutes.
