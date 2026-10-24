/**
 * LayerBuffer — pixel storage for a single layer, backed by the tile cache.
 *
 * Holds an OffscreenCanvas raster of the full layer. Tiles (256x256) are
 * pushed into the tile cache as they're painted; the buffer re-rasterizes
 * dirty tiles into its OffscreenCanvas on demand. Provides ImageData for
 * GPU texture upload.
 */

import { TileCache, TILE_SIZE, pointToTile, rectToTiles, tileKey } from './tiles';

export interface LayerBufferOptions {
  width: number;
  height: number;
  cache: TileCache;
}

export class LayerBuffer {
  readonly width: number;
  readonly height: number;
  private cache: TileCache;
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D | null;
  private dirty = true;
  private dirtyRect: { x: number; y: number; width: number; height: number } | null = null;

  constructor({ width, height, cache }: LayerBufferOptions) {
    this.width = width;
    this.height = height;
    this.cache = cache;
    this.canvas = new OffscreenCanvas(width, height);
    const c = this.canvas.getContext('2d');
    this.ctx = c ?? null;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, width, height);
    }
  }

  /** Write a tile's ImageData into the buffer (canvas + cache). */
  setTile(tx: number, ty: number, data: ImageData) {
    if (this.ctx) {
      this.ctx.putImageData(data, tx * TILE_SIZE, ty * TILE_SIZE);
    }
    this.cache.set(tx, ty, { data, version: Date.now() });
    this.markDirty(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  getTile(tx: number, ty: number) {
    return this.cache.get(tx, ty);
  }

  private markDirty(x: number, y: number, w: number, h: number) {
    this.dirty = true;
    if (!this.dirtyRect) {
      this.dirtyRect = { x, y, width: w, height: h };
    } else {
      const r = this.dirtyRect;
      const left = Math.min(r.x, x);
      const top = Math.min(r.y, y);
      const right = Math.max(r.x + r.width, x + w);
      const bottom = Math.max(r.y + r.height, y + h);
      r.x = left;
      r.y = top;
      r.width = right - left;
      r.height = bottom - top;
    }
  }

  /**
   * Full-document ImageData for this layer (premultiplied RGBA).
   * Reads the live offscreen canvas — the brush draws directly into it, so this
   * is always current without a rasterize pass.
   */
  getImageData(): ImageData | null {
    if (!this.ctx) return null;
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  /** Clear the whole buffer to transparent. */
  clear() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    this.cache.clear();
    this.dirty = true;
    this.dirtyRect = { x: 0, y: 0, width: this.width, height: this.height };
  }

  getCanvas(): OffscreenCanvas {
    return this.canvas;
  }
}
