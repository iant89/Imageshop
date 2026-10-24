/**
 * Appearance theme management.
 * Light / Dark / Auto driven by prefers-color-scheme with a manual override.
 * Persists choice to localStorage. Exposes document-element classes consumed
 * by CSS (appearance-light / appearance-dark) and accessibility preferences.
 */

export type Appearance = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'imageshop.appearance';

export class ThemeManager {
  private root: HTMLElement;
  private appearance: Appearance = 'auto';
  private media: MediaQueryList | null = null;
  private listeners: Set<() => void> = new Set();

  constructor(root: HTMLElement = document.documentElement) {
    this.root = root;
    this.load();
    this.apply();
    this.watchSystem();
  }

  getAppearance(): Appearance {
    return this.appearance;
  }

  setAppearance(value: Appearance) {
    this.appearance = value;
    this.persist();
    this.apply();
    this.notify();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Appearance | null;
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        this.appearance = stored;
      }
    } catch {
      // ignore storage errors
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, this.appearance);
    } catch {
      // ignore
    }
  }

  private resolveAppearance(): 'light' | 'dark' {
    if (this.appearance === 'auto') {
      return this.media?.matches ? 'dark' : 'light';
    }
    return this.appearance;
  }

  private apply() {
    const resolved = this.resolveAppearance();
    this.root.setAttribute('data-appearance', resolved);
    this.root.classList.toggle('appearance-dark', resolved === 'dark');
    this.root.classList.toggle('appearance-light', resolved === 'light');
    this.root.classList.toggle('light', resolved === 'light');
    this.root.classList.toggle('dark', resolved === 'dark');
  }

  private watchSystem() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.media = window.matchMedia('(prefers-color-scheme: dark)');
    this.media.addEventListener('change', () => {
      if (this.appearance === 'auto') {
        this.apply();
        this.notify();
      }
    });
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

/**
 * Accessibility preference helpers read from system media queries.
 */
export const prefersReduceTransparency = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-transparency: reduce)').matches;

export const prefersIncreaseContrast = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-contrast: more)').matches;

export const prefersReduceMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const applyA11yPreferences = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (prefersReduceTransparency()) root.classList.add('reduce-transparency');
  if (prefersIncreaseContrast()) root.classList.add('increase-contrast');
  if (prefersReduceMotion()) root.classList.add('reduced-motion');
};
