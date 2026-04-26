# Phase 2 — Proposal Editor (the hero)

**Estimate:** ~2 weeks for a polished v1. Single largest screen in the system.

## Goal

Port `client/src/router/ProposalEditor.vue` (520 lines) and its sub-components from the legacy 350px-sidebar + Card grid to the new three-pane workbench: **collapsible outline · dense editor table · totals/inspector rail**, with sticky chrome and a status bar.

## Source files

- Design canvas section `01 — Proposal Editor` in `.claude-design-tmp/swiftcpq/project/SwiftCPQ Power-User Redesign.html` (artboard width 1600 × 920).
- React mockup: `.claude-design-tmp/swiftcpq/project/components/ProposalEditor.jsx` (~750 lines). Read **all of it** — it's the visual contract.

## Target screens

1. **Editor (default).** Three-pane layout. The middle pane lists product rows with inline `qty / cost / price / disc` cells; comment rows render as accent-tinted callouts; description expansion adds a second `<tr>` below the row.
2. **Outline pane (left).** Collapsible to a 32px vertical "OUTLINE" rail. Section nav items have a drag handle (⋮⋮), title, item count, locked/optional indicators, and a hover-revealed lock toggle.
3. **Inspector pane (right).** Same collapse pattern — collapsed shows a vertical "SUMMARY" label. Expanded shows `Stat` rows (Items, Margin, Total) and an activity feed.
4. **Sub-header.** Identifier · `draft` Tag · timestamps · Sections / Items / Margin / Total / Expires `Stat`s.
5. **Status bar.** `synced` dot + section/item/margin/total readout + keyboard hints.

## Existing files (read these first)

| File | Purpose |
| ---- | ------- |
| `client/src/router/ProposalEditor.vue` | Top-level. Loads proposal, draws the legacy 2-column grid, owns save/preview/PDF buttons, history dialog, version-revert. |
| `client/src/components/ProposalSection.vue` (~219 lines) | Renders a single section card. |
| `client/src/components/SectionHeader.vue` (~172 lines) | Section title + actions. |
| `client/src/components/SectionProductsTable.vue` (~241 lines) | Product line items table — primary inline-editing surface. |
| `client/src/components/SectionTotalsTable.vue` (~147 lines) | Section totals breakdown. |
| `client/src/components/SectionMilestonesTable.vue` (~117 lines) | Milestones for a section. |
| `client/src/components/SectionInfoEditor.vue` (~10 lines) | Info-section content editor (Quill). |
| `client/src/components/CataloguePickerDialog.vue` | Picker for adding catalogue items. |
| `client/src/store/proposalStore.ts` | All proposal state — DO NOT REWRITE. |

## Pinia store touchpoints (do not refactor)

- `proposalStore.data` — the live `Proposal` object.
- `proposalStore.isDraft`, `changeCount`, `totalsRecalculated` — drives the "unsaved" Tag and pulse animation.
- `recalculateTotals()` — runs on every item edit; preserves the float-rounding fix (`* 1000`).
- `recalculateSectionItem(sectionId, itemId, fieldUpdated)` — call after each inline cell commit.
- `recalculateMilestones(sectionId, section)` — run when milestone amounts or parent section totals change.
- Section + item + milestone CRUD methods live on the store; the editor just calls them.
- A `BroadcastChannel` keeps multiple open tabs in sync — keep this working through the migration.

## Key UI primitives needed (build into `client/src/ui/`)

These components do not yet exist. Build them **before** touching the editor view.

- `Stat.vue` — small label-over-value pair. Props: `label`, `value`, `tone?: 'success'|'warn'|'error'|'info'`, `bold?: boolean`. Used in the sub-header and the right inspector. Reference: `ProposalEditor.jsx` lines 87–92.
- `OutlineNavItem.vue` — section row in the left rail. Props: `id`, `title`, `type`, `items`, `locked`, `recurring`, `active`. Drag handle + hover-only lock toggle. Reference: editor JSX `SectionNavItem`.
- `InlineEditCell.vue` — single editable cell for the products table. Props: `value`, `type: 'qty'|'price'|'cost'|'text'`, `disabled?`. Emits `commit` on Enter / Tab / blur, `revert` on Escape. Tab moves to next cell in same row, Enter to next row. **This is the single most fiddly component in the whole migration** (per the bundle's chat transcript). Plan ≥ 2 days for this alone.
- `ActivityRow.vue` — `actor · verb · target · timestamp` row for the inspector feed. Mostly cosmetic.
- `CollapsibleRail.vue` — generic 32px-collapsed / 240px-expanded panel with rotated label and chevron toggle. Both outline and inspector use it.

## DataTable strategy

The editor's product table needs spreadsheet-grade keyboard navigation (Tab cell-to-cell, Enter row-to-row, Escape revert, no flicker on commit). PrimeVue v4's `DataTable` cell editing is close but needs `pt` overrides to feel native.

Two options — pick **before** writing code:
- **A. Hand-rolled `<table class="swift-table">`** with `<InlineEditCell>` per cell. Maximum control, but you re-implement column resizing / virtualization later.
- **B. PrimeVue `DataTable` + `editMode="cell"` + `pt` overrides** for row height, padding, focus styles. Less code, less control.

Recommendation: **A** for phase 2; reach for B only if/when virtualization becomes a need.

## API gaps to address

- The existing API has no concept of "unsaved changes count" / "modified by" / "expires on date" beyond what's already in the Proposal type. Surface only what's there in phase 2; flag missing UI fields with TODO comments.

## `pt` cookbook (write alongside this phase)

Create `client/src/styles/pt/` containing one file per overridden component. Phase 2 needs at minimum:

- `button.ts` — height, padding, kbd-chip on the right.
- `inputtext.ts` — height (26px), font (Inter), padding.
- `select.ts` — height + dropdown styling.
- `dialog.ts` — backdrop, header padding (32px), border radius `--r-lg`.
- `editor.ts` (Quill) — toolbar background `--surface-50`, border `--border`.
- `tabs.ts` — 30px tab height, count badge styling.

Wire these via `app.use(PrimeVue, { pt: { Button: buttonPt, ... } })` in `main.ts`.

## Things that are easy to get wrong

1. **Don't re-introduce hex colors.** The legacy editor has `#083e69` for card titles, `#cdcdcd` for borders, `#636363` for the comment border. All of those become `var(--accent)`, `var(--border)`, `var(--accent)` respectively.
2. **Don't break BroadcastChannel sync.** Test by opening two tabs to the same proposal and editing in one — the other should pulse + refresh.
3. **Don't lose the `pulse animation on totals recalc`.** Re-implement using the existing `totalsRecalculated` ref + a CSS class that lives ≥ 600ms.
4. **The Quill editor in info sections still uses `.product-comment .p-editor`** — keep the global selector in `App.vue` working.
5. **Don't forget keyboard shortcuts.** `⌘S` save, `⌘D` duplicate row, `⌘↵` send. Surface them via `<Kbd>` in the topbar.

## Verification

1. Open `/proposals/:id`. Three panes render. Outline collapses/expands. Inspector collapses/expands.
2. Edit a `qty` cell with Tab — focus moves to `cost`, then `price`, then next row. Esc reverts.
3. Watch a numeric edit: totals pulse + the unsaved Tag in the topbar increments.
4. Open the same proposal in another tab. Edit in one. The other shows a "modified externally" indicator and offers reload.
5. Save with `⌘S`. The unsaved Tag clears.
6. Lock a section in the outline; the lock icon turns accent-colored.

## First steps for the next agent

1. Read `.claude-design-tmp/swiftcpq/project/components/ProposalEditor.jsx` end-to-end (~750 lines).
2. Build `client/src/ui/Stat.vue` and verify it works in isolation by adding it to `ProposalList.vue`'s topbar as a prop-check.
3. Build `client/src/ui/CollapsibleRail.vue` next — it's the load-bearing layout piece for both side panes.
4. Then build `InlineEditCell.vue` — budget 2 days. Write a Vitest spec for the keyboard navigation matrix BEFORE wiring it into the editor.
5. Only after these primitives work do you touch `ProposalEditor.vue` itself.
