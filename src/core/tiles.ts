/**
 * Tiled pixel cache.
 *
 * Documents are divided into 256x256 tiles. Each tile holds pixel data
 * (ImageData) plus dirty state. The cache is LRU-bounded by a configurable
 * VRAM budget so very large documents don't exhaust GPU memory.
 */

export const TILE_SIZE = 256;

export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TileData {
  /** Pixel data for this tile (premultiplied RGBA). */
  data: ImageData;
  version: number;
}

export interface TileCoords {
  tx: number;
  ty: number;
}

export function tileKey(tx: number, ty: number) {
  return `${tx},${ty}`;
}

export function pointToTile(x: number, y: number): TileCoords {
  return { tx: Math.floor(x / TILE_SIZE), ty: Math.floor(y / TILE_SIZE) };
}

export function rectToTiles(rect: TileRect): TileCoords[] {
  const cols = Math.ceil(rect.width / TILE_SIZE);
  const rows = Math.ceil(rect.height / TILE_SIZE);
  const out: TileCoords[] = [];
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      out.push({ tx: Math.floor(rect.x / TILE_SIZE) + tx, ty: Math.floor(rect.y / TILE_SIZE) + ty });
    }
  }
  return out;
}

export interface TileCacheOptions {
  /** Maximum number of tiles to keep resident (default ~ enough for 1.5GB at 256px RGBA8). */
  maxTiles?: number;
}

export class TileCache {
  private tiles = new Map<string, TileData>();
  private order: string[] = []; // LRU order, front = most recent
  private readonly maxTiles: number;

  constructor(options: TileCacheOptions = {}) {
    this.maxTiles = options.maxTiles ?? 256;
  }

  get(tx: number, ty: number): TileData | undefined {
    const key = tileKey(tx, ty);
    const data = this.tiles.get(key);
    if (!data) return undefined;
    this.touch(key);
    return data;
  }

  set(tx: number, ty: number, data: TileData) {
    const key = tileKey(tx, ty);
    if (this.tiles.has(key)) {
      this.tiles.set(key, data);
      this.touch(key);
      return;
    }
    this.tiles.set(key, data);
    this.order.unshift(key);
    this.evict();
  }

  has(tx: number, ty: number): boolean {
    return this.tiles.has(tileKey(tx, ty));
  }

  delete(tx: number, ty: number) {
    const key = tileKey(tx, ty);
    this.tiles.delete(key);
    this.order = this.order.filter((k) => k !== key);
  }

  clear() {
    this.tiles.clear();
    this.order = [];
  }

  size() {
    return this.tiles.size;
  }

  private touch(key: string) {
    this.order = this.order.filter((k) => k !== key);
    this.order.unshift(key);
  }

  private evict() {
    while (this.order.length > this.maxTiles) {
      const key = this.order.pop()!;
      this.tiles.delete(key);
    }
  }

  /** Estimate resident memory in bytes (RGBA8 = 4 bytes per pixel per tile). */
  memoryBytes() {
    return this.tiles.size * TILE_SIZE * TILE_SIZE * 4;
  }
}
