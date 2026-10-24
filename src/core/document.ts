/**
 * Core document model.
 *
 * A document owns a flat list of layers. Nesting is expressed via `parentId`;
 * the root layers are those with no parentId. Layers reference pixel buffers
 * held in the tiled tile cache (see core/tiles.ts), not in this model, so the
 * document stays small and serializable.
 */

export type ColorMode = 'RGB' | 'Grayscale' | 'CMYK';

export type BlendMode =
  | 'normal'
  | 'dissolve'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'linear-dodge'
  | 'linear-burn'
  | 'vivid-light'
  | 'pin-light'
  | 'hard-mix'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type LayerKind = 'image' | 'group' | 'adjustment' | 'smart-object';

export type LockFlags = 'none' | 'alpha' | 'position' | 'all';

export interface LayerEffect {
  id: string;
  kind: 'drop-shadow' | 'inner-shadow' | 'outer-glow' | 'inner-glow' | 'stroke' | 'bevel';
  enabled: boolean;
  opacity: number;
  // effect-specific params stored as a loose map; parsed by the effects shader.
  params: Record<string, number | string | boolean>;
}

export interface Layer {
  id: string;
  parentId: string | null;
  kind: LayerKind;
  name: string;
  visible: boolean;
  opacity: number; // 0..1
  blendMode: BlendMode;
  lock: LockFlags;
  colorTag?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
  // Effects (non-destructive)
  effects: LayerEffect[];
  // Transform (for smart objects & free transform)
  transform: Transform;
  // Size of the layer's pixel canvas (may differ from document size)
  width: number;
  height: number;
  // Tile cache key(s) holding pixel data; empty until painted/imported.
  tileKey: string | null;
}

export interface Transform {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotate: number; // radians
  skewX: number;
  skewY: number;
}

export const defaultTransform: Transform = {
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  skewX: 0,
  skewY: 0,
};

export interface Selection {
  kind: 'none' | 'rect' | 'ellipse' | 'lasso' | 'polygon' | 'mask';
  // Normalized 0..1 rect for rect/ellipse; points for lasso/polygon.
  rect?: { x: number; y: number; width: number; height: number };
  points?: { x: number; y: number }[];
  feather: number;
  // Inverted selection
  inverted: boolean;
}

export interface Document {
  id: string;
  title: string;
  width: number;
  height: number;
  dpi: number;
  colorMode: ColorMode;
  layers: Layer[];
  activeLayerId: string | null;
  selection: Selection;
  dirty: boolean;
  createdAt: number;
  updatedAt: number;
}

export function createDocument(
  id: string,
  title: string,
  width: number,
  height: number,
  dpi = 72,
  colorMode: ColorMode = 'RGB'
): Document {
  const now = Date.now();
  const background: Layer = {
    id: 'layer-bg',
    parentId: null,
    kind: 'image',
    name: 'Background',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    lock: 'all',
    effects: [],
    transform: defaultTransform,
    width,
    height,
    tileKey: null,
  };
  return {
    id,
    title,
    width,
    height,
    dpi,
    colorMode,
    layers: [background],
    activeLayerId: 'layer-bg',
    selection: { kind: 'none', feather: 0, inverted: false },
    dirty: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getLayer(document: Document, id: string): Layer | undefined {
  return document.layers.find((l) => l.id === id);
}

export function getRootLayers(document: Document): Layer[] {
  return document.layers.filter((l) => l.parentId === null);
}

export function getChildren(document: Document, parentId: string): Layer[] {
  return document.layers.filter((l) => l.parentId === parentId);
}

export function defaultBlendModes(): BlendMode[] {
  return [
    'normal',
    'dissolve',
    'darken',
    'lighten',
    'difference',
    'exclusion',
    'multiply',
    'screen',
    'overlay',
    'soft-light',
    'hard-light',
    'color-dodge',
    'color-burn',
    'linear-dodge',
    'linear-burn',
    'vivid-light',
    'pin-light',
    'hard-mix',
    'hue',
    'saturation',
    'color',
    'luminosity',
  ];
}
