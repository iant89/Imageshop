/**
 * App shell state — panels, appearance & a11y preferences.
 * Zustand + Immer. One store slice; UI concerns only — document state lives in
 * @/state/document.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import type { Appearance } from '@/design/theme';
import { applyA11yPreferences } from '@/design/theme';

export type PanelId =
  | 'tools'
  | 'layers'
  | 'color'
  | 'swatches'
  | 'history'
  | 'adjustments'
  | 'navigator'
  | 'properties';

export interface PanelConfig {
  id: PanelId;
  title: string;
  width: number;
  height: number;
  visible: boolean;
  docked: boolean;
}

export interface AppState {
  // Panels
  panels: PanelConfig[];
  // Appearance
  appearance: Appearance;
  reduceTransparency: boolean;
  increaseContrast: boolean;
  reduceMotion: boolean;
  // Actions
  addPanel: (p: PanelConfig) => void;
  updatePanel: (id: PanelId, patch: Partial<PanelConfig>) => void;
  togglePanel: (id: PanelId) => void;
  setAppearance: (a: Appearance) => void;
  setA11y: (
    patch: Partial<
      Pick<AppState, 'reduceTransparency' | 'increaseContrast' | 'reduceMotion'>
    >
  ) => void;
  // Accessors
  getPanel: (id: PanelId) => PanelConfig | undefined;
}

const initialPanels: PanelConfig[] = [
  { id: 'tools', title: 'Tools', width: 320, height: 500, visible: true, docked: true },
  { id: 'layers', title: 'Layers', width: 320, height: 400, visible: true, docked: true },
  { id: 'color', title: 'Color', width: 260, height: 320, visible: false, docked: true },
  { id: 'history', title: 'History', width: 260, height: 320, visible: false, docked: true },
  { id: 'navigator', title: 'Navigator', width: 260, height: 220, visible: false, docked: true },
  { id: 'adjustments', title: 'Adjustments', width: 300, height: 360, visible: false, docked: true },
  { id: 'properties', title: 'Properties', width: 300, height: 320, visible: false, docked: true },
  { id: 'swatches', title: 'Swatches', width: 260, height: 300, visible: false, docked: true },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      panels: initialPanels,
      appearance: 'auto',
      reduceTransparency: false,
      increaseContrast: false,
      reduceMotion: false,

      addPanel: (p) =>
        set((s) =>
          produce(s, (draft) => {
            draft.panels.push(p);
          })
        ),

      updatePanel: (id, patch) =>
        set((s) =>
          produce(s, (draft) => {
            const p = draft.panels.find((p) => p.id === id);
            if (p) Object.assign(p, patch);
          })
        ),

      togglePanel: (id) =>
        set((s) =>
          produce(s, (draft) => {
            const p = draft.panels.find((p) => p.id === id);
            if (p) p.visible = !p.visible;
          })
        ),

      setAppearance: (a) => set({ appearance: a }),

      setA11y: (patch) =>
        set((s) =>
          produce(s, (draft) => {
            Object.assign(draft, patch);
          })
        ),

      getPanel: (id) => get().panels.find((p) => p.id === id),
    }),
    {
      name: 'imageshop.app',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        panels: s.panels,
        appearance: s.appearance,
        reduceTransparency: s.reduceTransparency,
        increaseContrast: s.increaseContrast,
        reduceMotion: s.reduceMotion,
      }),
    }
  )
);

// Hydration side-effects: apply theme + a11y classes after load.
export function syncAppStoreToDOM() {
  const { appearance, reduceTransparency, increaseContrast, reduceMotion } =
    useAppStore.getState();
  const root = document.documentElement;
  root.classList.toggle('reduce-transparency', reduceTransparency);
  root.classList.toggle('increase-contrast', increaseContrast);
  root.classList.toggle('reduced-motion', reduceMotion);
  applyA11yPreferences();
}