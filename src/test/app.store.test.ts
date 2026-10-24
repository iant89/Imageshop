import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '@/state/app';
import type { AnyWindow, DocumentWindow } from '@/state/app';

const added: string[] = [];

function asDocument(w: AnyWindow | undefined): DocumentWindow | undefined {
  return w && w.kind === 'document' ? (w as DocumentWindow) : undefined;
}

afterEach(() => {
  // Clean up any windows/panels added by tests so they don't leak across tests.
  for (const id of added) {
    useAppStore.getState().removeWindow(id);
  }
  added.length = 0;
});

describe('app store', () => {
  it('adds and focuses a document window', () => {
    const { addWindow, focusWindow, getWindow } = useAppStore.getState();
    addWindow({
      id: 'w1',
      kind: 'document',
      title: 'T1',
      documentId: 'd1',
      frame: { x: 0, y: 0, width: 100, height: 100 },
      visible: true,
      focused: false,
      minimized: false,
      zoom: 1,
      dirty: false,
    });
    added.push('w1');
    focusWindow('w1');
    expect(useAppStore.getState().focusedWindowId).toBe('w1');
    expect(getWindow('w1')?.focused).toBe(true);
  });

  it('cycles windows', () => {
    const { addWindow, cycleWindows } = useAppStore.getState();
    addWindow({
      id: 'a',
      kind: 'document',
      title: 'A',
      documentId: 'a',
      frame: { x: 0, y: 0, width: 1, height: 1 },
      visible: true,
      focused: true,
      minimized: false,
      zoom: 1,
      dirty: false,
    });
    addWindow({
      id: 'b',
      kind: 'document',
      title: 'B',
      documentId: 'b',
      frame: { x: 0, y: 0, width: 1, height: 1 },
      visible: true,
      focused: false,
      minimized: false,
      zoom: 1,
      dirty: false,
    });
    added.push('a', 'b');
    cycleWindows();
    expect(useAppStore.getState().focusedWindowId).toBe('b');
  });

  it('tracks dirty state', () => {
    const { addWindow, setWindowDirty, getWindow } = useAppStore.getState();
    addWindow({
      id: 'd',
      kind: 'document',
      title: 'D',
      documentId: 'd',
      frame: { x: 0, y: 0, width: 1, height: 1 },
      visible: true,
      focused: true,
      minimized: false,
      zoom: 1,
      dirty: false,
    });
    added.push('d');
    setWindowDirty('d', true);
    const wd = asDocument(useAppStore.getState().getWindow('d'));
    expect(wd?.dirty).toBe(true);
    setWindowDirty('d', false);
    expect(asDocument(useAppStore.getState().getWindow('d'))?.dirty).toBe(false);
  });

  it('toggles and docks panels', () => {
    const { togglePanel, setPanelDocked, getPanel } = useAppStore.getState();
    togglePanel('color');
    expect(getPanel('color')?.visible).toBe(true);
    setPanelDocked('color', true, 'right', 'layers');
    expect(getPanel('color')?.docked).toBe(true);
    expect(getPanel('color')?.dockSide).toBe('right');
    expect(getPanel('color')?.dockParent).toBe('layers');
  });

  it('cycles appearance', () => {
    const { setAppearance } = useAppStore.getState();
    setAppearance('dark');
    expect(useAppStore.getState().appearance).toBe('dark');
    setAppearance('light');
    expect(useAppStore.getState().appearance).toBe('light');
  });
});
