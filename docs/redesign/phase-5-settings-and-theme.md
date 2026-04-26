# Phase 5 — Settings & Theme controls

**Estimate:** ~3 days.

## Goal

`useTheme()` exists and works (phase 1) — but there's no UI to flip mode or accent. Phase 5 wires real toggles into `client/src/router/Settings.vue` and persists the choice via the existing tenant settings API.

## Existing state

- `client/src/composables/useTheme.ts` — exposes `mode`, `accent`, `setMode`, `setAccent`. Persists to `localStorage.swiftcpq.theme.mode` / `.accent`.
- `client/src/router/Settings.vue` — current form has free-text `primaryColour`, `secondaryColour`, `accentColour` hex inputs in the "Theme Colours" card. These are tenant-wide and stored on `SystemSettings`.
- The new design uses a fixed accent palette (`amber | indigo | violet | green | red`) — free hex input no longer makes sense.

## Two layers of theme

The new system separates concerns:

| Layer | Persistence | Scope |
| ----- | ----------- | ----- |
| **Mode** (dark / light) | `localStorage` (per-browser) | Personal preference |
| **Accent** (amber / indigo / …) | Two-tier: tenant default in `SystemSettings.accent`, per-user override in `localStorage` | Tenant brand with personal override |

The `localStorage` write already happens. Phase 5 adds the tenant default and the per-user override mechanic.

## Backend changes

`SystemSettings` schema today has `primaryColour / secondaryColour / accentColour` as free text. Refactor to:

- Replace `primaryColour / secondaryColour / accentColour` with a single `accent: 'amber' | 'indigo' | 'violet' | 'green' | 'red'` enum.
- Migrate existing tenants — pick `'amber'` as default unless an existing hex is recognisable, in which case map.
- Update the `GetSystemSettings` / `UpdateSystemSettings` endpoints. Drop the old fields from the response after the migration window.

## UI changes (`Settings.vue`)

Replace the "Theme Colours" card with a "Theme" card:

```vue
<Card>
  <template #title>Theme</template>
  <template #content>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="swift-label">Mode</label>
        <SegmentedControl v-model="mode" :options="['dark', 'light']" />
      </div>
      <div>
        <label class="swift-label">Tenant accent</label>
        <AccentPicker v-model="form.accent" />
        <p class="swift-help">Default for everyone in this tenant. Each user can override.</p>
      </div>
    </div>
  </template>
</Card>
```

`AccentPicker.vue` renders the five swatches as a row of 24px circles with the accent value as `background`. Click sets the value. Add to `client/src/ui/`.

## Wiring

1. On `Settings.vue` mount, `loadSettings()` reads `data.accent` and stores on `form.accent`.
2. On save, `UpdateSystemSettings({ accent })` persists. After save, call `setAccent(form.accent)` so the change is immediate.
3. On app boot (`useTheme` initial load) prefer this priority order:
   1. `localStorage.swiftcpq.theme.accent` (per-user override, if set)
   2. The tenant `SystemSettings.accent` (fetched once at boot, cached on `useTenantStore` or similar)
   3. Default `'amber'`
4. Add a "Reset to tenant default" link in personal preferences (a separate `Account.vue` if it doesn't exist yet, or a section in the existing user menu) that clears the localStorage override.

## Per-user override location

There is no "user preferences" page today. Two options:
- **A. Add a small Account view** at `/account` reachable from the SideNav user footer dropdown.
- **B. Put the personal mode toggle in the SideNav user footer popover** (one click to flip dark/light).

**Recommend B for the mode toggle** (it's a frequent action), **plus A for accent override** (rare, deserves a real screen).

## Things that are easy to get wrong

1. **Don't bypass `setMode` / `setAccent`.** Direct DOM mutation drifts from the localStorage write. Always go through the composable.
2. **Don't ship the schema migration without a fallback.** Read the old hex fields if `accent` is null, map to nearest enum, then write back.
3. **The `Settings.vue` toolbar still uses a hardcoded `#ebeef0`** — fix this to `var(--surface-50)` while you're in the file.

## Verification

1. Open `/settings`. The Theme card shows mode and accent controls.
2. Switch mode in the SideNav popover — entire app re-skins immediately. Reload — choice persists.
3. Switch tenant accent in `/settings`, save. The whole UI re-skins. Reload — choice persists. Open in another browser (different localStorage) — same accent shows because it came from the tenant.
4. In `/account`, click "Reset to tenant default" → user override clears and the tenant value applies.

## First steps for the next agent

1. Build `AccentPicker.vue` and `SegmentedControl.vue` (the latter is also needed by phase 3).
2. Schema migration: rename `*Colour` → `accent` enum on `SystemSettings`; write the data migration.
3. Update `Settings.vue` to use the new card.
4. Add the SideNav user footer popover with a mode toggle.
5. Update `useTheme` initial load to read tenant settings (need a small `useTenantStore`).
