/**
 * Window — macOS document window with traffic lights, draggable title bar,
 * 8-direction resize, double-click to zoom, minimize-to-dock animation,
 * close sheet for dirty documents, focus/z-order handling.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon, MinimizeIcon, MaximizeIcon } from '@/design/icons';
import { GlassSurface } from './GlassSurface';
import { useWindowManager } from './useWindowManager';
import styles from './Window.module.css';

export interface WindowProps {
  id: string;
  title: string;
  documentId?: string; // for document windows
  onClose?: () => void;
  children: React.ReactNode;
  zoomed?: boolean;
  onToggleZoom?: () => void;
  focused?: boolean;
  width?: number;
  height?: number;
}

export function Window({ id, title, documentId, onClose, children, zoomed = false, onToggleZoom, focused = false, width, height }: WindowProps) {
  const { focus, minimize, restore, setFrame, close } = useWindowManager();
  const [dirty, setDirty] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(zoomed ?? false);
  const [prevFrame, setPrevFrame] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const titleRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });

  // Resize state
  const [resizing, setResizing] = useState<ResizeDir | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, frame: { x: 0, y: 0, w: 0, h: 0 } });

  const minW = 300;
  const minH = 200;

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      focus(id);
      if (e.detail >= 2) {
        toggleZoom();
        return;
      }
      setDragging(true);
      const rect = winRef.current!.getBoundingClientRect();
      dragStart.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    },
    [focus, id]
  );

  const handleResizeMouseDown = useCallback(
    (dir: ResizeDir) => (e: React.MouseEvent) => {
      e.stopPropagation();
      focus(id);
      setResizing(dir);
      const rect = winRef.current!.getBoundingClientRect();
      resizeStart.current = { x: e.clientX, y: e.clientY, frame: { x: rect.left, y: rect.top, w: rect.width, h: rect.height } };
    },
    [focus, id]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging) {
        const x = dragStart.current.left + (e.clientX - dragStart.current.x);
        const y = dragStart.current.top + (e.clientY - dragStart.current.y);
        winRef.current!.style.left = `${x}px`;
        winRef.current!.style.top = `${y}px`;
        setFrame(id, { x, y });
        return;
      }
      if (resizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        let { x, y, w, h } = resizeStart.current.frame;
        switch (resizing) {
          case 'e': w = Math.max(minW, w + dx); break;
          case 's': h = Math.max(minH, h + dy); break;
          case 'se': w = Math.max(minW, w + dx); h = Math.max(minH, h + dy); break;
          case 'w': { const nw = Math.max(minW, w - dx); x += w - nw; w = nw; break; }
          case 'n': { const nh = Math.max(minH, h - dy); y += h - nh; h = nh; break; }
          case 'nw': { const nw = Math.max(minW, w - dx); const nh = Math.max(minH, h - dy); x += w - nw; y += h - nh; w = nw; h = nh; break; }
          case 'ne': { const nw = Math.max(minW, w - dx); x += w - nw; w = nw; h = Math.max(minH, h + dy); break; }
          case 'sw': { const nw = Math.max(minW, w - dx); x += w - nw; w = nw; h = Math.max(minH, h + dy); break; }
        }
        winRef.current!.style.left = `${x}px`;
        winRef.current!.style.top = `${y}px`;
        winRef.current!.style.width = `${w}px`;
        winRef.current!.style.height = `${h}px`;
        setFrame(id, { x, y, width: w, height: h });
        return;
      }
    },
    [dragging, resizing, id, minW, minH, setFrame]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setResizing(null);
  }, []);

  const toggleZoom = useCallback(() => {
    if (!isZoomed) {
      setPrevFrame({ x: parseFloat(winRef.current!.style.left || '0'), y: parseFloat(winRef.current!.style.top || '0'), w: winRef.current!.offsetWidth, h: winRef.current!.offsetHeight });
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  }, [isZoomed]);

  // Close behavior: dirty document → close sheet
  const handleClose = useCallback(() => {
    if (dirty) {
      setSheetOpen(true);
    } else {
      close(id);
    }
  }, [dirty, close, id]);

  // Global listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={winRef}
      className={cn(styles.window, isZoomed && styles.zoomed, dirty && styles.dirty, focused && styles.focused)}
      style={{
        width,
        height,
        zIndex: focused ? 20 : 10,
      } as React.CSSProperties}
    >
      {/* Traffic lights */}
      <div className={styles.trafficLights}>
        <button
          className={cn(styles.light, styles.lightRed, dirty && styles.lightDirty)}
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          aria-label="Close"
        >
          <CloseIcon size={10} />
        </button>
        <button
          className={styles.light}
          onClick={(e) => { e.stopPropagation(); minimize(id); }}
          aria-label="Minimize"
        >
          <MinimizeIcon size={10} />
        </button>
        <button
          className={cn(styles.light, styles.lightGreen)}
          onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
          aria-label="Zoom"
        >
          <MaximizeIcon size={10} />
        </button>
      </div>

      {/* Title bar */}
      <div ref={titleRef} className={styles.titleBar} onMouseDown={handleTitleMouseDown} role="heading" aria-label={title}>
        <span className={styles.titleText}>{title}</span>
      </div>

      {/* Glass content surface */}
      <GlassSurface variant="panel" elevation="medium" className={styles.content} plain>
        <div className={styles.pane}>{children}</div>
      </GlassSurface>

      {/* Resizers (8 directions) */}
      <div className={cn(styles.resizer, styles.resizerN)} onMouseDown={handleResizeMouseDown('n')} />
      <div className={cn(styles.resizer, styles.resizerS)} onMouseDown={handleResizeMouseDown('s')} />
      <div className={cn(styles.resizer, styles.resizerE)} onMouseDown={handleResizeMouseDown('e')} />
      <div className={cn(styles.resizer, styles.resizerW)} onMouseDown={handleResizeMouseDown('w')} />
      <div className={cn(styles.resizer, styles.resizerNE)} onMouseDown={handleResizeMouseDown('ne')} />
      <div className={cn(styles.resizer, styles.resizerNW)} onMouseDown={handleResizeMouseDown('nw')} />
      <div className={cn(styles.resizer, styles.resizerSE)} onMouseDown={handleResizeMouseDown('se')} />
      <div className={cn(styles.resizer, styles.resizerSW)} onMouseDown={handleResizeMouseDown('sw')} />

      {/* Close sheet */}
      {sheetOpen && (
        <div className={styles.sheetOverlay} onClick={() => setSheetOpen(false)}>
          <div className={styles.sheet}>
            <h3>Save changes to “{title}”?</h3>
            <div className={styles.sheetActions}>
              <button className={styles.sheetBtn} onClick={() => { setSheetOpen(false); close(id); }}>Don't Save</button>
              <button className={cn(styles.sheetBtn, styles.sheetBtnCancel)} onClick={() => setSheetOpen(false)}>Cancel</button>
              <button className={cn(styles.sheetBtn, styles.sheetBtnSave)} onClick={() => { setSheetOpen(false); close(id); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
