import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { useTheme } from '../../../src/composables/useTheme';

// The composable is module-scoped (single shared store), so the tests must run
// sequentially against the same instance. Each test toggles to a known state
// and then asserts.
describe('useTheme', () => {
  it('toggles theme classes on <html> when mode changes', async () => {
    const { setMode } = useTheme();

    setMode('light');
    await nextTick();
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    setMode('dark');
    await nextTick();
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('injects per-accent CSS variables and persists the choice', async () => {
    const { setAccent } = useTheme();

    setAccent('indigo');
    await nextTick();
    const style = document.getElementById('swiftcpq-accent-style');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('--accent:');
    expect(style!.textContent).toContain('265');
    expect(localStorage.getItem('swiftcpq.theme.accent')).toBe('indigo');

    setAccent('green');
    await nextTick();
    expect(localStorage.getItem('swiftcpq.theme.accent')).toBe('green');
    expect(document.getElementById('swiftcpq-accent-style')!.textContent).toContain('155');
  });

  it('returns reactive refs for mode and accent', async () => {
    const { mode, accent, setMode, setAccent } = useTheme();
    setMode('dark');
    setAccent('amber');
    await nextTick();
    expect(mode.value).toBe('dark');
    expect(accent.value).toBe('amber');
  });
});
