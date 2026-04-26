import { ref, watch } from 'vue';

export type ThemeMode = 'dark' | 'light';
export type ThemeAccent = 'amber' | 'indigo' | 'violet' | 'green' | 'red';

const STORAGE_MODE = 'swiftcpq.theme.mode';
const STORAGE_ACCENT = 'swiftcpq.theme.accent';
const STYLE_ID = 'swiftcpq-accent-style';

const ACCENTS: Record<ThemeAccent, { dark: string; darkHover: string; light: string; lightHover: string }> = {
  amber:  { dark: 'oklch(0.80 0.15 78)',  darkHover: 'oklch(0.85 0.15 78)',  light: 'oklch(0.55 0.18 35)',  lightHover: 'oklch(0.50 0.18 35)' },
  indigo: { dark: 'oklch(0.72 0.16 265)', darkHover: 'oklch(0.78 0.16 265)', light: 'oklch(0.50 0.20 265)', lightHover: 'oklch(0.45 0.20 265)' },
  violet: { dark: 'oklch(0.74 0.16 300)', darkHover: 'oklch(0.80 0.16 300)', light: 'oklch(0.52 0.20 300)', lightHover: 'oklch(0.47 0.20 300)' },
  green:  { dark: 'oklch(0.78 0.16 155)', darkHover: 'oklch(0.84 0.16 155)', light: 'oklch(0.50 0.18 155)', lightHover: 'oklch(0.45 0.18 155)' },
  red:    { dark: 'oklch(0.72 0.18 25)',  darkHover: 'oklch(0.78 0.18 25)',  light: 'oklch(0.52 0.20 25)',  lightHover: 'oklch(0.47 0.20 25)' },
};

const ssr = typeof window === 'undefined';

const initialMode: ThemeMode = ssr ? 'dark' : ((localStorage.getItem(STORAGE_MODE) as ThemeMode) || 'dark');
const initialAccent: ThemeAccent = ssr ? 'amber' : ((localStorage.getItem(STORAGE_ACCENT) as ThemeAccent) || 'amber');

const mode = ref<ThemeMode>(initialMode);
const accent = ref<ThemeAccent>(initialAccent);

function applyMode(m: ThemeMode) {
  if (ssr) return;
  const html = document.documentElement;
  html.classList.toggle('theme-dark', m === 'dark');
  html.classList.toggle('theme-light', m === 'light');
  // PrimeVue's darkModeSelector is '.dark' (configured in main.ts).
  html.classList.toggle('dark', m === 'dark');
}

function applyAccent(m: ThemeMode, a: ThemeAccent) {
  if (ssr) return;
  const c = ACCENTS[a] || ACCENTS.amber;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
    .theme-dark { --accent: ${c.dark}; --accent-hover: ${c.darkHover}; --accent-bg: color-mix(in oklch, ${c.dark} 18%, transparent); --focus-ring: color-mix(in oklch, ${c.dark} 40%, transparent); }
    .theme-light { --accent: ${c.light}; --accent-hover: ${c.lightHover}; --accent-bg: color-mix(in oklch, ${c.light} 12%, transparent); --focus-ring: color-mix(in oklch, ${c.light} 35%, transparent); }
  `;
  void m; // suppressed: per-mode application is implicit in the selector above
}

watch(mode, (m) => {
  applyMode(m);
  if (!ssr) localStorage.setItem(STORAGE_MODE, m);
}, { immediate: true });

watch([mode, accent], ([m, a]) => {
  applyAccent(m, a);
  if (!ssr) localStorage.setItem(STORAGE_ACCENT, a);
}, { immediate: true });

export function useTheme() {
  return {
    mode,
    accent,
    setMode(m: ThemeMode) { mode.value = m; },
    setAccent(a: ThemeAccent) { accent.value = a; },
  };
}
