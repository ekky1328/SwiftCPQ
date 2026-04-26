# Phase 3 — Catalogue (List + Item detail + Bundle detail)

**Estimate:** ~1.5 weeks. Three related screens.

## Goal

Replace the legacy single-file `client/src/router/Catalogue.vue` (275 lines, dialog-based editing) with **three full-page screens**:

1. **Catalogue list** — dense table with side inspector showing usage + 90-day price-history sparkline.
2. **Catalogue Item detail** — single product. Identity · pricing · volume tiers · suppliers · margin guard · where-used.
3. **Catalogue Bundle detail** — required components, optional add-ons, configuration rules, roll-up pricing, targeting.

The current schema has `type: 'PRODUCT' | 'BUNDLE'` — both detail views share a route (`/catalogue/:id`) and render different middle sections based on type.

## Source files (design)

- `.claude-design-tmp/swiftcpq/project/components/Catalogue.jsx` — list + side inspector
- `.claude-design-tmp/swiftcpq/project/components/CatalogueItem.jsx` (~422 lines) — product detail
- `.claude-design-tmp/swiftcpq/project/components/CatalogueBundle.jsx` (~415 lines) — bundle detail
- Canvas sections: 04 — Catalogue · 05 — Catalogue Item · 06 — Catalogue Bundle

## Existing files

- `client/src/router/Catalogue.vue` — list + create/update dialog. Talks to `GetCatalogueItems`, `CreateCatalogueItem`, `UpdateCatalogueItem`, `DeleteCatalogueItem` in `client/src/api/api.ts`.
- No detail route exists yet — add `/catalogue/:id` to `client/src/router/index.ts`.

## Backend / schema gaps

The new design surfaces several fields that **don't exist server-side** yet. Each is a decision point — either extend the API or render the section as a placeholder with a TODO. The current Catalogue Item schema (per `Catalogue.vue` form) is roughly: `sku, title, description, type, cost, price, status, tags`.

Fields the new design assumes:

- **Volume tiers** (`min, max, unitPrice, discount, margin, notes`) — a new sub-table per item.
- **Suppliers** (`vendor, vendorSku, cost, leadTimeDays, moq, stockStatus, isPrimary`) — 1..N per item.
- **Margin guard** (`floorPct, targetPct, ceilingPct`) — per-item pricing guardrails.
- **Stock & sourcing** (`onHand, allocated, available, reorderPoint, leadTimeDays, warehouse`) — read-only inventory snapshot.
- **Specifications** — free-form key/value pairs OR a typed schema per category (likely free-form for v1).
- **Where used** — needs a backend query: "list proposals/bundles containing this item".
- **Audit log** — needs a server-side audit trail (auditStore on the server, if present).
- **Bundle-specific:**
  - **Required components** (`itemId, quantity, behavior`: `fixed | bounded | followsParent | open`)
  - **Optional add-ons** (`itemId, defaultEnabled, conditionalSubtotal`)
  - **Configuration rules** (`type: auto|default|require|block, when, then`)
  - **Targeting** (`tier, seatRange, region, vertical`)

**Recommendation for phase 3:** scope the UI to render **all** sections, but implement persistence only for fields the backend already supports (identity, pricing). Mark the rest with a yellow `<Tag kind="warn">preview</Tag>` and a TODO referencing this doc. Phase 3.5 (later) wires up the backend.

## Primitives to build (in `client/src/ui/`)

- `MarginGuard.vue` — the floor / target / ceiling bar with stamps. Pure CSS/SVG.
- `Sparkline.vue` — 90-day price history. Inline SVG, ~30 lines. Reference: bundle's chat transcript.
- `SegmentedControl.vue` — for `PRODUCT / BUNDLE / SERVICE` type pickers.
- `RuleRow.vue` — `WHEN → THEN` row for bundle config rules.

## Routes to add

```ts
// router/index.ts
{ path: '/catalogue/:id', component: () => import('./CatalogueDetail.vue') },
```

`CatalogueDetail.vue` reads `:id`, fetches the item, then renders either `<CatalogueItemView>` or `<CatalogueBundleView>` based on `item.type`. Shared topbar + tabs lives in the parent.

## Things that are easy to get wrong

1. **Don't break the existing dialog flow** until the detail route ships. Either keep it as a fallback for items lacking the new fields, or migrate atomically.
2. **The Editor (Quill) used in the description field** carries the same global `.p-editor` styling — it'll inherit the new theme automatically.
3. **The DataTable inside Volume tiers / Suppliers** uses inline editing, so coordinate with phase 2's `InlineEditCell.vue` (don't duplicate the implementation).

## Verification

1. `/catalogue` renders the new list with side inspector. Click a row → inspector populates.
2. Click into a product → `/catalogue/:id` renders the item detail with identity, pricing, suppliers, margin guard.
3. Click into a bundle → same route renders required components + add-ons + rules instead of suppliers.
4. Edit identity / pricing → save persists via existing `UpdateCatalogueItem`.
5. Sections backed by phantom data show the warn `preview` Tag.

## First steps for the next agent

1. Read `Catalogue.jsx`, `CatalogueItem.jsx`, `CatalogueBundle.jsx` from `.claude-design-tmp/swiftcpq/project/components/`.
2. Build `Sparkline.vue` and `MarginGuard.vue` in `client/src/ui/` (small, atomic, easy wins).
3. Add the `/catalogue/:id` route and a stub `CatalogueDetail.vue` that just renders the chosen view based on type.
4. Migrate the list view first (it's the simplest, mirrors phase 1's ProposalList work).
5. Build the item detail. Then the bundle detail.
