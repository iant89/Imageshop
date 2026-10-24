/**
 * useWindowManager — custom hook driving the macOS window system.
 * Wraps the app store and adds window lifecycle helpers used by Window +
 * Desktop: create, focus/raise, minimize/restore, cycle, close.
 */

import { useCallback } from 'react';
import { useAppStore } from '@/state/app';
import type { DocumentWindow, PanelWindow, WindowFrame } from '@/state/app';

const DEFAULT_FRAME: WindowFrame = { x: 100, y: 100, width: 800, height: 600 };

export function useWindowManager() {
  const {
    windows,
    focusedWindowId,
    addWindow,
    removeWindow,
    focusWindow,
    setWindowFrame,
    setWindowMinimized,
    setWindowDirty,
    cycleWindows,
    getWindow,
  } = useAppStore();

  const createDocumentWindow = useCallback(
    (documentId: string, title: string, frame: Partial<WindowFrame> = {}) => {
      const id = `win-${documentId}`;
      const full: WindowFrame = { ...DEFAULT_FRAME, ...frame };
      const existing = getWindow(id);
      if (existing) {
        focusWindow(id);
        setWindowMinimized(id, false);
        return id;
      }
      addWindow({ id, kind: 'document', title, documentId, frame: full, visible: true, focused: true, minimized: false, zoom: 1, dirty: false });
      return id;
    },
    [addWindow, focusWindow, getWindow, setWindowMinimized]
  );

  const focus = useCallback((id: string) => {
    focusWindow(id);
  }, [focusWindow]);

  const close = useCallback((id: string) => {
    removeWindow(id);
  }, [removeWindow]);

  const minimize = useCallback((id: string) => {
    setWindowMinimized(id, true);
  }, [setWindowMinimized]);

  const restore = useCallback((id: string) => {
    setWindowMinimized(id, false);
  }, [setWindowMinimized]);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    setWindowDirty(id, dirty);
  }, [setWindowDirty]);

  return {
    windows,
    focusedWindowId,
    createDocumentWindow,
    focus,
    close,
    minimize,
    restore,
    setFrame: setWindowFrame,
    setDirty,
    cycleWindows,
    getWindow,
    defaultFrame: DEFAULT_FRAME,
  };
}
