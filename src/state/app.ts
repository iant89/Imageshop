/**
 * App shell state — window manager, panels, dock, appearance & a11y preferences.
 * Zustand + Immer. One store slice; UI concerns only — document state lives in
 * @/state/document.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import type { Appearance } from '@/design/theme';
import { applyA11yPreferences } from '@/design/theme';

export type WindowKind = 'document' | 'panel';
export type PanelId =
  | 'tools'
  | 'layers'
  | 'color'
  | 'swatches'
  | 'history'
  | 'adjustments'
  | 'navigator'
  | 'properties';

export interface WindowFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelConfig {
  id: PanelId;
  title: string;
  width: number;
  height: number;
  visible: boolean;
  docked: boolean; // false = floating
  dockSide?: 'left' | 'right' | 'top' | 'bottom' | 'tab';
  dockParent?: string; // id of the panel/window it's docked to
  tabIndex?: number; // position within a tab stack
  floatingFrame?: WindowFrame;
  collapsed?: boolean;
}

export interface DocumentWindow {
  id: string;
  kind: 'document';
  title: string;
  documentId: string; // reference into document store
  frame: WindowFrame;
  visible: boolean;
  focused: boolean;
  minimized: boolean;
  zoom: number;
  dirty: boolean;
}

export interface PanelWindow {
  id: string;
  kind: 'panel';
  panelId: PanelId;
  frame: WindowFrame;
  visible: boolean;
  focused: boolean;
}

export type AnyWindow = DocumentWindow | PanelWindow;

export interface DockItem {
  id: string;
  label: string;
  icon: string;
  running: boolean;
  busy: boolean;
  windowId?: string; // document window currently representing this item
}

export interface AppState {
  // Windows
  windows: AnyWindow[];
  focusedWindowId: string | null;
  // Panels
  panels: PanelConfig[];
  // Dock
  dockItems: DockItem[];
  // Appearance
  appearance: Appearance;
  reduceTransparency: boolean;
  increaseContrast: boolean;
  reduceMotion: boolean;
  // Actions
  addWindow: (w: AnyWindow) => void;
  removeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  setWindowFrame: (id: string, frame: Partial<WindowFrame>) => void;
  setWindowFocused: (id: string, focused: boolean) => void;
  setWindowMinimized: (id: string, minimized: boolean) => void;
  setWindowDirty: (id: string, dirty: boolean) => void;
  cycleWindows: () => void;
  addPanel: (p: PanelConfig) => void;
  updatePanel: (id: PanelId, patch: Partial<PanelConfig>) => void;
  togglePanel: (id: PanelId) => void;
  setPanelDocked: (id: PanelId, docked: boolean, side?: PanelConfig['dockSide'], parent?: string) => void;
  setAppearance: (a: Appearance) => void;
  setA11y: (patch: Partial<Pick<AppState, 'reduceTransparency' | 'increaseContrast' | 'reduceMotion'>>) => void;
  addDockItem: (item: DockItem) => void;
  setDockRunning: (id: string, running: boolean) => void;
  setDockBusy: (id: string, busy: boolean) => void;
  // Accessors
  getWindow: (id: string) => AnyWindow | undefined;
  getPanel: (id: PanelId) => PanelConfig | undefined;
}

const initialPanels: PanelConfig[] = [
  { id: 'tools', title: 'Tools', width: 150, height: 420, visible: true, docked: false, floatingFrame: { x: 20, y: 80, width: 150, height: 420 } },
  { id: 'layers', title: 'Layers', width: 240, height: 340, visible: true, docked: false, floatingFrame: { x: 180, y: 80, width: 240, height: 340 } },
  { id: 'color', title: 'Color', width: 200, height: 300, visible: false, docked: false, floatingFrame: { x: 430, y: 80, width: 200, height: 300 } },
  { id: 'history', title: 'History', width: 240, height: 300, visible: false, docked: false, floatingFrame: { x: 640, y: 80, width: 240, height: 300 } },
  { id: 'navigator', title: 'Navigator', width: 220, height: 180, visible: false, docked: false, floatingFrame: { x: 870, y: 80, width: 220, height: 180 } },
  { id: 'adjustments', title: 'Adjustments', width: 240, height: 320, visible: false, docked: false, floatingFrame: { x: 180, y: 430, width: 240, height: 320 } },
  { id: 'properties', title: 'Properties', width: 240, height: 300, visible: false, docked: false, floatingFrame: { x: 430, y: 390, width: 240, height: 300 } },
  { id: 'swatches', title: 'Swatches', width: 200, height: 260, visible: false, docked: false, floatingFrame: { x: 430, y: 700, width: 200, height: 260 } },
];

const initialDock: DockItem[] = [
  { id: 'finder', label: 'Finder', icon: '🟦', running: true, busy: false },
  { id: 'imageshop', label: 'Imageshop', icon: '🖼️', running: true, busy: false },
  { id: 'safari', label: 'Safari', icon: '🧭', running: false, busy: false },
  { id: 'mail', label: 'Mail', icon: '✉️', running: false, busy: false },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      windows: [],
      focusedWindowId: null,
      panels: initialPanels,
      dockItems: initialDock,
      appearance: 'auto',
      reduceTransparency: false,
      increaseContrast: false,
      reduceMotion: false,

      addWindow: (w) =>
        set((s) =>
          produce(s, (draft) => {
            draft.windows.push(w);
            const shouldFocus = w.focused || draft.focusedWindowId === null;
            if (shouldFocus) {
              draft.focusedWindowId = w.id;
              // deactivate all others
              for (const win of draft.windows) win.focused = win.id === w.id;
            }
          })
        ),

      removeWindow: (id) =>
        set((s) =>
          produce(s, (draft) => {
            draft.windows = draft.windows.filter((w) => w.id !== id);
            if (draft.focusedWindowId === id) {
              const next = draft.windows[draft.windows.length - 1];
              draft.focusedWindowId = next ? next.id : null;
              if (next) next.focused = true;
            }
          })
        ),

      focusWindow: (id) =>
        set((s) =>
          produce(s, (draft) => {
            for (const w of draft.windows) w.focused = w.id === id;
            draft.focusedWindowId = id;
          })
        ),

      setWindowFrame: (id, frame) =>
        set((s) =>
          produce(s, (draft) => {
            const w = draft.windows.find((w) => w.id === id);
            if (w) Object.assign(w.frame, frame);
          })
        ),

      setWindowFocused: (id, focused) =>
        set((s) =>
          produce(s, (draft) => {
            const w = draft.windows.find((w) => w.id === id);
            if (w) w.focused = focused;
            draft.focusedWindowId = focused ? id : draft.focusedWindowId;
          })
        ),

      setWindowMinimized: (id, minimized) =>
        set((s) =>
          produce(s, (draft) => {
            const w = draft.windows.find((w) => w.id === id);
            if (w && w.kind === 'document') {
              w.minimized = minimized;
              if (!minimized) {
                for (const other of draft.windows) other.focused = false;
                w.focused = true;
                draft.focusedWindowId = id;
              }
            }
          })
        ),

      setWindowDirty: (id, dirty) =>
        set((s) =>
          produce(s, (draft) => {
            const w = draft.windows.find((w) => w.id === id);
            if (w && w.kind === 'document') w.dirty = dirty;
          })
        ),

      cycleWindows: () =>
        set((s) =>
          produce(s, (draft) => {
            const visible = draft.windows.filter(
              (w) => w.visible && !(w.kind === 'document' && w.minimized)
            );
            if (visible.length === 0) return;
            const cur = draft.focusedWindowId
              ? visible.findIndex((w) => w.id === draft.focusedWindowId)
              : -1;
            const next = visible[(cur + 1) % visible.length]!;
            for (const w of draft.windows) w.focused = w.id === next.id;
            draft.focusedWindowId = next.id;
          })
        ),

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

      setPanelDocked: (id, docked, side, parent) =>
        set((s) =>
          produce(s, (draft) => {
            const p = draft.panels.find((p) => p.id === id);
            if (p) {
              p.docked = docked;
              if (side) p.dockSide = side;
              if (parent) p.dockParent = parent;
              if (!docked) {
                p.dockSide = undefined;
                p.dockParent = undefined;
              }
            }
          })
        ),

      setAppearance: (a) => set({ appearance: a }),

      setA11y: (patch) =>
        set((s) =>
          produce(s, (draft) => {
            Object.assign(draft, patch);
          })
        ),

      addDockItem: (item) =>
        set((s) =>
          produce(s, (draft) => {
            draft.dockItems.push(item);
          })
        ),

      setDockRunning: (id, running) =>
        set((s) =>
          produce(s, (draft) => {
            const i = draft.dockItems.find((d) => d.id === id);
            if (i) i.running = running;
          })
        ),

      setDockBusy: (id, busy) =>
        set((s) =>
          produce(s, (draft) => {
            const i = draft.dockItems.find((d) => d.id === id);
            if (i) i.busy = busy;
          })
        ),

      getWindow: (id) => get().windows.find((w) => w.id === id),

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
        dockItems: s.dockItems,
      }),
    }
  )
);

// Hydration side-effects: apply theme + a11y classes after load.
export function syncAppStoreToDOM() {
  const { appearance, reduceTransparency, increaseContrast, reduceMotion } = useAppStore.getState();
  const root = document.documentElement;
  root.classList.toggle('reduce-transparency', reduceTransparency);
  root.classList.toggle('increase-contrast', increaseContrast);
  root.classList.toggle('reduced-motion', reduceMotion);
  applyA11yPreferences();
}
