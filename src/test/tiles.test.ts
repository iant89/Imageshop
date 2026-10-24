import { describe, it, expect } from 'vitest';
import { TileCache, TILE_SIZE, pointToTile, rectToTiles } from '@/core/tiles';

// jsdom/node doesn't expose the ImageData constructor; fake a minimal one.
function fakeImageData(w: number, h: number): ImageData {
  return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h } as unknown as ImageData;
}

describe('tile cache', () => {
  it('evicts LRU tiles past the budget', () => {
    const cache = new TileCache({ maxTiles: 3 });
    const data = fakeImageData(4, 4);
    cache.set(0, 0, { data, version: 1 });
    cache.set(1, 0, { data, version: 2 });
    cache.set(2, 0, { data, version: 3 });
    expect(cache.size()).toBe(3);
    // Access (0,0) to make it most-recent, then add a 4th -> (1,0) evicted.
    cache.get(0, 0);
    cache.set(3, 0, { data, version: 4 });
    expect(cache.has(0, 0)).toBe(true);
    expect(cache.has(1, 0)).toBe(false);
    expect(cache.has(3, 0)).toBe(true);
    expect(cache.size()).toBe(3);
  });

  it('reports memory bytes', () => {
    const cache = new TileCache({ maxTiles: 10 });
    const data = fakeImageData(TILE_SIZE, TILE_SIZE);
    cache.set(0, 0, { data, version: 1 });
    expect(cache.memoryBytes()).toBe(TILE_SIZE * TILE_SIZE * 4);
  });
});

describe('tile coordinate math', () => {
  it('pointToTile and rectToTiles', () => {
    expect(pointToTile(0, 0)).toEqual({ tx: 0, ty: 0 });
    expect(pointToTile(256, 256)).toEqual({ tx: 1, ty: 1 });
    expect(pointToTile(511, 0)).toEqual({ tx: 1, ty: 0 });
    const tiles = rectToTiles({ x: 0, y: 0, width: 512, height: 512 });
    expect(tiles.length).toBe(4);
    expect(tiles).toContainEqual({ tx: 0, ty: 0 });
    expect(tiles).toContainEqual({ tx: 1, ty: 1 });
  });
});
