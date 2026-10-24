/**
 * Tools store — active tool + brush settings.
 * Separate state slice per the architecture requirements.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ToolId =
  | 'brush'
  | 'eraser'
  | 'move'
  | 'hand'
  | 'zoom'
  | 'eyedropper'
  | 'crop'
  | 'pen'
  | 'text'
  | 'shape';

export interface BrushSettings {
  size: number; // diameter in px
  hardness: number; // 0..1 (0 = soft feathered, 1 = hard edge)
  opacity: number; // 0..1
  flow: number; // 0..1 build-up per stamp
  spacing: number; // 0..1 fraction of diameter between stamps
  color: string; // #rrggbb foreground
  pressureSize: boolean;
  pressureOpacity: boolean;
}

export const defaultBrushSettings: BrushSettings = {
  size: 30,
  hardness: 0.4,
  opacity: 1,
  flow: 1,
  spacing: 0.25,
  color: '#000000',
  pressureSize: true,
  pressureOpacity: true,
};

export interface ToolsState {
  activeTool: ToolId;
  brush: BrushSettings;
  setActiveTool: (t: ToolId) => void;
  setBrushSetting: (k: string, v: string | number | boolean) => void;
  setBrushSettings: (patch: Partial<BrushSettings>) => void;
  resetBrush: () => void;
}

export const useToolsStore = create<ToolsState>()(
  immer((set) => ({
    activeTool: 'brush',
    brush: { ...defaultBrushSettings },

    setActiveTool: (t) => set({ activeTool: t }),

    setBrushSetting: (k, v) =>
      set((s) => {
        (s.brush as Record<string, string | number | boolean>)[k] = v;
      }),

    setBrushSettings: (patch) =>
      set((s) => {
        Object.assign(s.brush, patch);
      }),

    resetBrush: () => set({ brush: { ...defaultBrushSettings } }),
  }))
);
