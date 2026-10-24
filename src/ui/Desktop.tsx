/**
 * Desktop — the macOS shell: wallpaper, menu bar, dock, and the window
 * container. Windows are absolutely positioned and reordered by focus so the
 * focused window always paints on top.
 */

import React, { useEffect } from 'react';
import { useAppStore } from '@/state/app';
import { Window } from './Window';
import { MenuBar } from './MenuBar';
import { Dock } from './Dock';
import { useDocumentStore } from '@/state/document';
import { PanelWindow } from './PanelWindow';
import type { DocumentWindow, WindowFrame } from '@/state/app';
import styles from './Desktop.module.css';
import { cn } from '@/utils/cn';
import { CanvasEditor } from './CanvasEditor';

const INITIAL_FRAME: WindowFrame = { x: 80, y: 90, width: 760, height: 560 };

export function Desktop() {
  const { windows, focusedWindowId, addWindow, panels } = useAppStore();
  const { createDocument } = useDocumentStore();

  // Seed the shell with a document + a document window.
  useEffect(() => {
    if (windows.length === 0) {
      const docId = createDocument('Untitled-1', 800, 600, 72, 'RGB');
      addWindow({
        id: 'win-untitled-1',
        kind: 'document',
        title: 'Untitled-1',
        documentId: docId,
        frame: INITIAL_FRAME,
        visible: true,
        focused: true,
        minimized: false,
        zoom: 1,
        dirty: false,
      });
    }
  }, [windows.length, addWindow, createDocument]);

  // Global keyboard shortcuts for window management.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (!cmd) return;
      if (e.key === '`') {
        // cycleWindows stubbed (no panel windows yet)
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
      }
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focusedWindowId]);

  // Sort all windows so the focused one paints on top.
  const ordered = [...windows].sort(
    (a, b) =>
      a.id === focusedWindowId ? 1 : b.id === focusedWindowId ? -1 : 0
  );

  return (
    <div className={styles.desktop}>
      <div className={styles.wallpaper}>
        <div className={styles.gradient} />
        <div className={styles.noise} />
      </div>
      <MenuBar />
      <div className={styles.windowsContainer}>
        {ordered
          .filter((w): w is DocumentWindow => w.kind === 'document')
          .map((w) => {
            if (w.visible === false || w.minimized) return null;
            const isFocused = w.id === focusedWindowId;
            return (
              <div
                key={w.id}
                className={cn(styles.windowWrap, isFocused && styles.focused)}
                style={{
                  left: w.frame.x,
                  top: w.frame.y,
                  width: w.frame.width,
                  height: w.frame.height,
                  zIndex: isFocused ? 20 : 10,
                }}
                data-focus={isFocused}
              >
                <Window id={w.id} title={w.title} focused={isFocused}>
                  <CanvasEditor documentId={w.documentId} />
                </Window>
              </div>
            );
          })}
        {/* Floating panels — positioned from their saved floating frames. */}
        {panels
          .filter((p) => p.visible && !p.docked)
          .map((p) => (
            <PanelWindow key={`panel-${p.id}`} panel={p} />
          ))}
      </div>
      <Dock />
    </div>
  );
}
