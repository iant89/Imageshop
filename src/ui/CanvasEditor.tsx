/**
 * CanvasEditor — the document canvas display.
 *
 * Owns a WebGL2 Compositor and a LayerBuffer per document layer. Receives the
 * document id, composites the layer stack on the GPU, and presents to an
 * on-screen canvas on a requestAnimationFrame loop.
 *
 * React never re-renders on pointer move / pan / zoom; the loop reads dirty
 * flags from refs and redraws the GPU surface directly.
 *
 * Brush engine (Milestone 4, simplified):
 *   * Pointerdown/move/up with Pointer Events pressure + getCoalescedEvents()
 *   * Evenly spaced stamps along the stroke (brush spacing)
 *   * Pressure-driven size & opacity
 *   * Tile-level copy-on-write snapshots; one undo entry per stroke
 *   * Full re-composite per move in this milestone; dirty-tile GPU upload is
 *     the noted optimization path (core/tiles.ts + compositor).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '@/state/document';
import type { Document, Layer } from '@/core/document';
import { Compositor } from '@/render/compositor';
import { TileCache, TILE_SIZE, pointToTile } from '@/core/tiles';
import { LayerBuffer } from '@/core/layerBuffer';
import { useToolsStore } from '@/state/tools';
import {
  brushRadius,
  brushOpacity,
  brushSpacing,
  brushStamp,
  interpolatePoints,
  type BrushCtx,
  type BrushPoint,
} from '@/tools/brush';
import styles from './CanvasEditor.module.css';

export interface CanvasEditorProps {
  documentId: string;
}

type PointerLike = { clientX: number; clientY: number; pressure?: number };

export function CanvasEditor({ documentId }: CanvasEditorProps) {
  const { getDocument, getActiveLayer, setDocumentDirty } = useDocumentStore();
  const { brush, activeTool } = useToolsStore();
  const history = useDocumentStore.getState().history;

  const [size, setSize] = useState({ width: 0, height: 0 });

  const docRef = useRef<Document | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tileCacheRef = useRef<TileCache | null>(null);
  const buffersRef = useRef<Map<string, LayerBuffer>>(new Map());
  const compositorRef = useRef<Compositor | null>(null);

  // Stroke state (kept in refs so pointer moves never touch React state).
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<BrushPoint | null>(null);
  const snapshotsRef = useRef<Map<string, ImageData>>(new Map());

  const draw = useCallback(() => {
    const document = docRef.current;
    const compositor = compositorRef.current;
    const buffers = buffersRef.current;
    const canvas = canvasRef.current;
    if (!document || !compositor || !buffers || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = document.width * dpr;
    canvas.height = document.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    compositor.composite(
      (layerId) => buffers.get(layerId) ?? null,
      document.layers
    );

    const off = compositor.canvas;
    ctx.clearRect(0, 0, document.width, document.height);
    ctx.drawImage(off, 0, 0, document.width, document.height);
  }, []);

  // ---- Initialize / re-initialize when the document changes ----
  useEffect(() => {
    const doc = getDocument(documentId);
    if (!doc) return;
    docRef.current = doc;
    setSize({ width: doc.width, height: doc.height });

    const cache = new TileCache({ maxTiles: 256 });
    tileCacheRef.current = cache;
    const buffers = new Map<string, LayerBuffer>();
    for (const layer of doc.layers) {
      const buf = new LayerBuffer({ width: doc.width, height: doc.height, cache });
      if (layer.kind === 'image' && layer.id === 'layer-bg') {
        const c = buf.getCanvas().getContext('2d')!;
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, doc.width, doc.height);
      }
      buffers.set(layer.id, buf);
    }
    buffersRef.current = buffers;
    compositorRef.current = new Compositor({ width: doc.width, height: doc.height });
    draw();
  }, [documentId, getDocument, draw]);

  // Re-draw whenever this document's layer stack or properties change.
  useEffect(() => {
    const unsub = useDocumentStore.subscribe(() => draw());
    draw();
    return unsub;
  }, [draw]);

  // ---- Pointer: start stroke ----
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const document = docRef.current;
      const buffers = buffersRef.current;
      const active = getActiveLayer(documentId);
      if (!document || !active || !buffers || !canvas) return;
      const buf = buffers.get(active.id);
      if (!buf) return;

      const ctx = buf.getCanvas().getContext('2d')!;
      const rect = canvas.getBoundingClientRect();
      const point = pointerPoint(e, rect, document);
      isDrawingRef.current = true;
      lastPointRef.current = point;
      snapshotsRef.current = new Map();

      // One undo entry for the whole stroke (tile-level copy-on-write).
      history.beginTransaction('Paint');
      captureTile(buf, point);
      const radius = brushRadius(
        { size: brush.size, pressureSize: brush.pressureSize },
        point.pressure
      );
      const opacity = brushOpacity(
        { opacity: brush.opacity, pressureOpacity: brush.pressureOpacity },
        point.pressure
      );
      stamp(
        ctx,
        point,
        radius,
        opacity,
        brush.color,
        activeTool === 'eraser' ? 'destination-out' : 'source-over'
      );
      setDocumentDirty(documentId, true);
      draw();
    },
    [draw, getActiveLayer, history, brush, activeTool, setDocumentDirty, documentId]
  );

  // ---- Pointer: move (native listener to capture leaves + coalesced events) ----
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      const document = docRef.current;
      const buffers = buffersRef.current;
      const active = getActiveLayer(documentId);
      if (!document || !active || !buffers || !canvas) return;
      const buf = buffers.get(active.id);
      if (!buf) return;

      const ctx = buf.getCanvas().getContext('2d')!;
      const rect = canvas.getBoundingClientRect();

      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      let prev = lastPointRef.current!;
      for (const ev of events) {
        const point = pointerPoint(ev, rect, document);
        const intermediates = interpolatePoints(prev, point, brushSpacing(brush));
        for (const p of intermediates) {
          const radius = brushRadius(
            { size: brush.size, pressureSize: brush.pressureSize },
            p.pressure
          );
          const opacity = brushOpacity(
            { opacity: brush.opacity, pressureOpacity: brush.pressureOpacity },
            p.pressure
          );
          captureTile(buf, p);
          stamp(
            ctx,
            p,
            radius,
            opacity,
            brush.color,
            activeTool === 'eraser' ? 'destination-out' : 'source-over'
          );
        }
        prev = point;
      }
      lastPointRef.current = prev;
      draw();
    };

    const onUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const document = docRef.current;
      const active = getActiveLayer(documentId);
      const buffers = buffersRef.current;
      if (document && active && buffers) {
        const buf = buffers.get(active.id);
        const snapshots = snapshotsRef.current;
        history.push({
          id: `hist-${crypto.randomUUID()}`,
          label: 'Paint',
          do: () => {
            // Pixels already applied; redo is a no-op in this simplified milestone.
          },
          undo: () => {
            const c = buf?.getCanvas().getContext('2d');
            if (!buf || !c) return;
            for (const [key, data] of snapshots) {
              const parts = key.split(',');
              const tx = Number(parts[0]);
              const ty = Number(parts[1]);
              c.putImageData(data, tx * TILE_SIZE, ty * TILE_SIZE);
            }
            draw();
          },
        });
      }
      lastPointRef.current = null;
      history.endTransaction();
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [draw, getActiveLayer, history, brush, activeTool, documentId]);

  // ---- Pointer coords from a PointerEvent ----
  function pointerPoint(e: PointerLike, rect: DOMRect, document: Document): BrushPoint {
    const x = ((e.clientX - rect.left) / rect.width) * document.width;
    const y = ((e.clientY - rect.top) / rect.height) * document.height;
    return { x, y, pressure: e.pressure ?? 0.5, timestamp: Date.now() };
  }

  // ---- Stamp a single brush mark into the active layer buffer ----
  function stamp(
    ctx: BrushCtx,
    point: BrushPoint,
    radius: number,
    opacity: number,
    color: string,
    composite: string
  ) {
    brushStamp({ ctx, x: point.x, y: point.y, radius, hardness: brush.hardness, opacity, color, composite });
  }

  // ---- Snapshot a tile's before-state the first time it's touched in a stroke ----
  function captureTile(buf: LayerBuffer, point: BrushPoint) {
    const { tx, ty } = pointToTile(point.x, point.y);
    const key = `${tx},${ty}`;
    if (snapshotsRef.current.has(key)) return;
    const c = buf.getCanvas().getContext('2d')!;
    const x = tx * TILE_SIZE;
    const y = ty * TILE_SIZE;
    const w = Math.min(TILE_SIZE, buf.width - x);
    const h = Math.min(TILE_SIZE, buf.height - y);
    if (w <= 0 || h <= 0) return;
    snapshotsRef.current.set(key, c.getImageData(x, y, w, h));
  }

  return (
    <div className={styles.wrapper} style={{ width: size.width, height: size.height }}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        style={{ width: size.width, height: size.height, cursor: 'crosshair' }}
      />
      <div className={styles.hint}>
        Brush: {Math.round(brush.size)}px &middot; {Math.round(brush.opacity * 100)}% opacity &middot;
        Pressure {brush.pressureSize ? 'on' : 'off'}
      </div>
    </div>
  );
}
