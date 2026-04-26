# Phase 4 — Proposal Preview / PDF

**Estimate:** ~1 week.

## Goal

Today the preview is rendered by the external `templater/` HTML route and opened in a new browser tab. The new design embeds preview **inside** the app — page thumbnail rail on the left, A4 canvas in the middle, pre-flight checks rail on the right.

## Source files (design)

- `.claude-design-tmp/swiftcpq/project/components/ProposalPreview.jsx`
- Canvas section `07 — Proposal Preview` in `SwiftCPQ Power-User Redesign.html`

## Existing surface

- Today, `ProposalEditor.vue` has a "Preview" / "PDF" button that opens the templater in a new window.
- `templater/` is a separate HTML/JS bundle that consumes the proposal JSON and renders print-ready output.
- A `DownloadProposalPdf` API call (added in commit `9307f07`) produces the PDF server-side.

## The decision to make first

**Embed templater via `<iframe>` OR re-render the preview natively in Vue.**

| Option | Pros | Cons |
| ------ | ---- | ---- |
| **A. `<iframe src="/templater/...">`** | Zero duplication. PDF and on-screen preview stay in sync by construction. | Theme tokens don't cross the iframe boundary — preview will look like the legacy templater unless restyled. Pre-flight check overlays are awkward. |
| **B. Native Vue re-render** | Shares tokens, looks identical to the rest of the app, supports overlays / annotations natively. | Two render paths to maintain (Vue for screen, templater for PDF). Drift risk. |

**Recommendation:** **A** for v1. Restyle `templater/` to read the same CSS variables (load `tokens.css` in the templater HTML). The pre-flight rail and thumbnail rail live in Vue *outside* the iframe.

## Target screens

1. **Three-pane layout.**
   - **Left rail (~140px):** vertical stack of page thumbnails. Click to scroll the canvas. Active page highlighted with the accent rail.
   - **Center:** A4 canvas. Scroll-snap on page boundaries. Watermark behind content if `proposal.status === 'draft'`.
   - **Right rail (~280px):** pre-flight checks (missing customer, expired pricing, unsigned approvals, etc.) as `<Tag>` rows. "Send" / "Download PDF" CTAs at the bottom.
2. **Topbar:** breadcrumb (`Proposals / PROP-123 / Preview`), `Tag` for status, `Btn` for "Back to editor", "Download PDF", "Send".
3. **Status bar:** page count, last regenerated timestamp, PDF size.

## Routes to add

```ts
{ path: '/proposals/:id/preview', component: () => import('./ProposalPreview.vue') },
```

## Primitives to build

- `PageThumb.vue` — scaled-down page chip for the left rail. Props: `pageNumber`, `active`, click handler.
- `PreflightItem.vue` — single check row. Props: `kind: 'pass' | 'warn' | 'error'`, `label`, optional `actionHref`.

The iframe-resize trick (auto-size the iframe to its content height) needs `postMessage` from templater → host. Add a small handshake to `templater/` that posts `{ type: 'page-count', value: N }` and `{ type: 'scroll', page: N }`.

## API gaps

- `DownloadProposalPdf` already exists. Confirm it streams back binary; if not, switch to `responseType: 'blob'` in `api.ts`.
- No "regenerate preview" endpoint — preview is computed client-side from the proposal JSON. Fine for v1.
- Pre-flight rules currently don't exist server-side. Compute client-side in phase 4 (a `usePreflight(proposal)` composable that returns `{ kind, label }[]`). Server-side validation can come later.

## Things that are easy to get wrong

1. **iframe + theme.** The iframe is its own document — `useTheme` won't reach it. Load `tokens.css` in the templater HTML *and* post `{ type: 'set-theme', mode, accent }` from host on theme change.
2. **Print stylesheet.** The PDF must keep its existing print CSS — don't blindly apply dark-mode tokens to the printed output. Gate dark variables with `@media screen`.
3. **Scroll sync** between thumbnail rail clicks and iframe scroll requires `IntersectionObserver` *inside* the iframe; observers can't cross the boundary.
4. **Send action** must remain idempotent — clicking Send twice should not double-fire. Use the existing `proposalStore.markSent()` (or equivalent) rather than calling the API directly from the view.

## Verification

1. `/proposals/:id/preview` renders the three-pane layout. Iframe loads templater.
2. Toggle theme — both shell and iframe contents re-skin.
3. Click a thumbnail — canvas scrolls to that page.
4. Click "Download PDF" — file downloads, opens correctly in a PDF viewer.
5. Pre-flight: open a proposal missing a customer → the corresponding `<PreflightItem kind="error">` appears.

## First steps for the next agent

1. Decide A vs. B (recommend A). Document the choice at the top of `ProposalPreview.vue`.
2. Add the route + a stub view that just shows an iframe pointing at the existing templater URL.
3. Build `PageThumb.vue` and `PreflightItem.vue`.
4. Wire the host ↔ iframe `postMessage` handshake.
5. Add `tokens.css` import to `templater/index.html` and gate dark vars with `@media screen`.
