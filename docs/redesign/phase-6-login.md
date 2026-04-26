# Phase 6 — Login redesign

**Estimate:** ~2 days.

## Goal

Restyle `client/src/router/Login.vue` to match the dark-first workbench aesthetic. Functional behavior is unchanged — local username/password, optional Microsoft Entra SSO, and the auth-config probe to decide which methods are available.

## Source files (design)

The design bundle has **no Login artboard**. Phase 6 is a new design done within the system's primitives. Use `tokens.css` and the `client/src/ui/` components — do not invent new chrome.

## Existing file

`client/src/router/Login.vue` (~195 lines):

- Centered card on a light gray background (`#ebeef0`).
- Hard-coded hex colors throughout the scoped style block.
- Uses PrimeVue `InputText`, `Password`, `Button`, `Message`, `ProgressSpinner`.
- Calls `/api/v1/auth/config` on mount → decides whether to show the local form, the Entra button, or both.
- Logic to keep: `handleLogin`, `handleEntraLogin`, the auth-config probe, the redirect-if-already-logged-in check.

## Target layout

Single screen, full viewport, `var(--surface-0)` background:

- Centered column, max-width ~360px.
- Brand block: `⚡ SwiftCPQ` in `--font-ui` 20px, all-caps small label below ("Sign in to your workspace").
- Local form (if `authMethods.local`): `swift-input` username, `swift-input` password, `Btn variant="primary"` "Sign in" with `kbd="↵"`.
- Entra button (if `authMethods.entra`): `Btn variant="default"` with the Microsoft glyph icon.
- Divider with mono-cased "OR" between them.
- Error state: `<Tag kind="error">` inline above the submit button.
- Bottom-of-screen mono footer: `version · environment · status dot`. Reuse `StatusBar` or a stripped equivalent.

The card itself is **not** a card with a shadow — it's just the column. Shadows are reserved for true overlays. The minimal chrome is intentional and matches the system's density-first aesthetic.

## Code-level changes

1. Drop the entire scoped `<style>` block. Replace `<main>` background with `var(--surface-0)`.
2. Replace `<InputText>` / `<Password>` with `<input class="swift-input">` if a 26px input is wanted, OR keep PrimeVue inputs and rely on the preset to style them. **Recommend the former** to keep the login screen consistent with the rest of the workbench's input height.
3. Replace `<Button>` with `<Btn>` from `client/src/ui/`. Use `variant="primary"` for sign-in, `variant="default"` for Entra.
4. Replace `<Message>` with `<Tag kind="error">`.
5. Replace `<ProgressSpinner>` (the loading-state for auth-config fetch) with a simple spinner — either the existing one or a small CSS keyframes spinner sized 16px.
6. Wrap the screen in a `<div class="swift-app theme-dark">` so it picks up tokens even though it's outside `<AppShell>` (the shell doesn't render until `auth.user` exists). Read `useTheme().mode.value` so the login screen respects the user's saved preference.

## Things that are easy to get wrong

1. **Don't render `<AppShell>` here** — the shell assumes an authenticated user and would show a useless empty sidebar.
2. **Preserve the Entra branch.** Some tenants use `authMethods.entra` only — both code paths must work. Test by mocking the `/api/v1/auth/config` response.
3. **Microsoft glyph.** PrimeIcons has `pi-microsoft`. Keep that, or add a `microsoft` glyph to `Icon.vue`.
4. **Password autofill.** Keep `autocomplete="username"` and `autocomplete="current-password"` on the inputs — without these, browser password managers break.
5. **Focus management.** Auto-focus the username field on mount unless the user is already authenticated (in which case, the redirect happens before render).

## Verification

1. Sign out. `/login` renders with the new dark layout. Username input is focused.
2. Submit valid creds → redirects to `/`. The shell loads with the same theme.
3. Submit invalid creds → error Tag appears inline above the button.
4. With `authMethods.entra` only, the local form is hidden and only the Microsoft button shows.
5. Toggle to light mode in localStorage, reload `/login` — login screen renders in light theme.
6. Tab order: username → password → sign-in. Enter submits.

## First steps for the next agent

1. Read `client/src/ui/Btn.vue`, `Tag.vue`, and the `swift-input` rules in `tokens.css` to confirm the primitives you'll reach for.
2. Replace the scoped style block with token-driven inline classes.
3. Swap PrimeVue components for the `client/src/ui/` equivalents.
4. Wrap the root in `<div class="swift-app" :class="`theme-${mode}`">` and import `useTheme`.
5. Test both auth method branches by toggling the `/api/v1/auth/config` mock.
